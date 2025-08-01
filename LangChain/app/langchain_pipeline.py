"""
LangChain integration for RAG (Retrieval-Augmented Generation) pipeline.
Handles vector storage, retrieval, and response generation with source citations.
"""
import os
import json
import faiss
import numpy as np
from typing import List, Dict, Tuple, Optional
from sentence_transformers import SentenceTransformer
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from app.models.pdf import PDFChunk


class VectorStore:
    """
    FAISS-based vector store for PDF chunk embeddings.
    Handles embedding generation, storage, and similarity search.
    """
    
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize vector store with embedding model.
        
        Args:
            model_name (str): SentenceTransformer model name
        """
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        self.chunk_metadata = {}  # Maps FAISS index to chunk metadata
        self.index_file = 'instance/faiss_index.bin'
        self.metadata_file = 'instance/chunk_metadata.json'
        
        # Load existing index if available
        self._load_index()
    
    def _load_index(self):
        """Load existing FAISS index and metadata from disk."""
        try:
            if os.path.exists(self.index_file) and os.path.exists(self.metadata_file):
                self.index = faiss.read_index(self.index_file)
                with open(self.metadata_file, 'r') as f:
                    self.chunk_metadata = json.load(f)
                print(f"Loaded existing index with {self.index.ntotal} vectors")
        except Exception as e:
            print(f"Failed to load existing index: {e}")
            self.index = faiss.IndexFlatIP(self.dimension)
            self.chunk_metadata = {}
    
    def _save_index(self):
        """Save FAISS index and metadata to disk."""
        try:
            os.makedirs('instance', exist_ok=True)
            faiss.write_index(self.index, self.index_file)
            with open(self.metadata_file, 'w') as f:
                json.dump(self.chunk_metadata, f)
        except Exception as e:
            print(f"Failed to save index: {e}")
    
    def add_chunk(self, chunk_id: int, content: str, metadata: Dict) -> str:
        """
        Add a text chunk to the vector store.
        
        Args:
            chunk_id (int): Database chunk ID
            content (str): Text content to embed
            metadata (Dict): Chunk metadata
            
        Returns:
            str: Embedding ID for reference
        """
        try:
            # Generate embedding
            embedding = self.model.encode([content])
            
            # Normalize for cosine similarity
            faiss.normalize_L2(embedding)
            
            # Add to index
            self.index.add(embedding)
            
            # Store metadata
            embedding_id = str(self.index.ntotal - 1)
            self.chunk_metadata[embedding_id] = {
                'chunk_id': chunk_id,
                'content': content,
                **metadata
            }
            
            # Save to disk
            self._save_index()
            
            return embedding_id
            
        except Exception as e:
            raise Exception(f"Failed to add chunk to vector store: {e}")
    
    def search(self, query: str, k: int = 5, user_id: Optional[int] = None) -> List[Dict]:
        """
        Search for similar chunks using vector similarity.
        
        Args:
            query (str): Search query
            k (int): Number of results to return
            user_id (int, optional): Filter by user ID
            
        Returns:
            List[Dict]: List of matching chunks with metadata and scores
        """
        if self.index.ntotal == 0:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.model.encode([query])
            faiss.normalize_L2(query_embedding)
            
            # Search
            scores, indices = self.index.search(query_embedding, min(k * 2, self.index.ntotal))
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:  # FAISS returns -1 for invalid indices
                    continue
                
                embedding_id = str(idx)
                if embedding_id not in self.chunk_metadata:
                    continue
                
                metadata = self.chunk_metadata[embedding_id]
                
                # Filter by user if specified
                if user_id:
                    chunk = PDFChunk.query.get(metadata['chunk_id'])
                    if not chunk or chunk.document.user_id != user_id:
                        continue
                
                results.append({
                    'chunk_id': metadata['chunk_id'],
                    'content': metadata['content'],
                    'document_name': metadata['document_name'],
                    'page_number': metadata['page_number'],
                    'score': float(score),
                    'metadata': metadata
                })
                
                if len(results) >= k:
                    break
            
            return results
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def remove_document_chunks(self, document_id: int):
        """
        Remove all chunks for a specific document.
        Note: FAISS doesn't support deletion, so we rebuild the index.
        
        Args:
            document_id (int): Document ID to remove
        """
        try:
            # Find chunks to remove
            chunks_to_remove = []
            for embedding_id, metadata in self.chunk_metadata.items():
                if metadata.get('document_id') == document_id:
                    chunks_to_remove.append(embedding_id)
            
            if not chunks_to_remove:
                return
            
            # Rebuild index without removed chunks
            new_index = faiss.IndexFlatIP(self.dimension)
            new_metadata = {}
            
            for embedding_id, metadata in self.chunk_metadata.items():
                if embedding_id not in chunks_to_remove:
                    # Re-encode and add to new index
                    embedding = self.model.encode([metadata['content']])
                    faiss.normalize_L2(embedding)
                    new_index.add(embedding)
                    
                    new_embedding_id = str(new_index.ntotal - 1)
                    new_metadata[new_embedding_id] = metadata
            
            # Replace old index
            self.index = new_index
            self.chunk_metadata = new_metadata
            self._save_index()
            
            print(f"Removed {len(chunks_to_remove)} chunks for document {document_id}")
            
        except Exception as e:
            print(f"Failed to remove document chunks: {e}")


class ChatPipeline:
    """
    LangChain-based chat pipeline for RAG responses.
    Handles context retrieval and response generation with citations.
    """
    
    def __init__(self):
        """Initialize chat pipeline with LLM and vector store."""
        self.vector_store = VectorStore()
        
        # Initialize OpenAI LLM (you can replace with other models)
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            print("Warning: OPENAI_API_KEY not set. Using mock responses.")
            self.llm = None
        else:
            self.llm = OpenAI(
                openai_api_key=api_key,
                temperature=0.7,
                max_tokens=1000
            )
        
        # Default prompt templates
        self.prompt_templates = {
            'default': """Based on the following context from PDF documents, answer the user's question. 
Include specific page references in your response.

Context:
{context}

Question: {question}

Answer with page references:""",
            
            'bullet_points': """Based on the following context from PDF documents, answer the user's question in bullet point format.
Include specific page references for each point.

Context:
{context}

Question: {question}

Answer in bullet points with page references:""",
            
            'story': """Based on the following context from PDF documents, answer the user's question in a narrative, story-like format.
Include specific page references naturally within the narrative.

Context:
{context}

Question: {question}

Answer as a narrative with page references:"""
        }
    
    def generate_response(self, question: str, user_id: int, 
                         template_type: str = 'default', 
                         custom_template: Optional[str] = None) -> Dict:
        """
        Generate response using RAG pipeline.
        
        Args:
            question (str): User question
            user_id (int): User ID for filtering documents
            template_type (str): Type of response template
            custom_template (str, optional): Custom prompt template
            
        Returns:
            Dict: Response with content and sources
        """
        try:
            # Retrieve relevant chunks
            relevant_chunks = self.vector_store.search(question, k=5, user_id=user_id)
            
            if not relevant_chunks:
                return {
                    'content': "I couldn't find any relevant information in your uploaded documents to answer this question.",
                    'sources': [],
                    'error': None
                }
            
            # Prepare context
            context_parts = []
            sources = []
            
            for chunk in relevant_chunks:
                context_parts.append(
                    f"From {chunk['document_name']} (Page {chunk['page_number']}):\n{chunk['content']}\n"
                )
                
                source_info = {
                    'document_name': chunk['document_name'],
                    'page_number': chunk['page_number'],
                    'score': chunk['score']
                }
                
                if source_info not in sources:
                    sources.append(source_info)
            
            context = "\n".join(context_parts)
            
            # Select prompt template
            if custom_template:
                template = custom_template
            else:
                template = self.prompt_templates.get(template_type, self.prompt_templates['default'])
            
            # Generate response
            if self.llm:
                prompt = PromptTemplate(
                    input_variables=["context", "question"],
                    template=template
                )
                
                chain = LLMChain(llm=self.llm, prompt=prompt)
                response = chain.run(context=context, question=question)
            else:
                # Mock response for development
                response = f"Based on the provided context from {len(sources)} sources, here's what I found regarding your question: '{question}'. " + \
                          f"The information comes from pages {', '.join([str(s['page_number']) for s in sources[:3]])}. " + \
                          "(This is a mock response - configure OPENAI_API_KEY for real responses.)"
            
            return {
                'content': response.strip(),
                'sources': sources,
                'error': None
            }
            
        except Exception as e:
            return {
                'content': "I encountered an error while processing your question. Please try again.",
                'sources': [],
                'error': str(e)
            }
    
    def get_available_templates(self) -> Dict[str, str]:
        """
        Get available prompt templates.
        
        Returns:
            Dict[str, str]: Template names and descriptions
        """
        return {
            'default': 'Standard response format',
            'bullet_points': 'Structured bullet point format',
            'story': 'Narrative story-like format'
        }
