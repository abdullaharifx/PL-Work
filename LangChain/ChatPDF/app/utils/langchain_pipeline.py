import os
import chromadb
from typing import List, Dict
from sentence_transformers import SentenceTransformer

# Import your models
from app.models.document_chunk import DocumentChunk
from app.models.pdf import PDF
from app.extensions import db

from app.models.chat import ChatSession


# Import LLM providers
try:
    from groq import Groq
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

def get_chroma_client():
    """Initialize ChromaDB client"""
    db_dir = os.getenv("CHROMA_DB_DIR", "./instance/vector_store/chroma_db")
    os.makedirs(db_dir, exist_ok=True)
    
    client = chromadb.PersistentClient(path=db_dir)
    return client

class VectorStore:
    """Vector store using ChromaDB"""
    
    def __init__(self):
        self.client = get_chroma_client()
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def get_collection_name(self, chat_id: int) -> str:
        return f"chat_{chat_id}"
    
    def get_or_create_collection(self, chat_id: int):
        collection_name = self.get_collection_name(chat_id)
        try:
            collection = self.client.get_collection(collection_name)
        except:
            collection = self.client.create_collection(collection_name)
        return collection
    
    def search_similar_chunks(self, chat_id: int, query: str, k: int = 5) -> List[Dict]:
        """Search for similar chunks in ChromaDB"""
        try:
            collection = self.get_or_create_collection(chat_id)
            
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query]).tolist()[0]
            print("query embeddings:" , query_embedding)
            # Search in ChromaDB
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=k
            )
            print("Search results:", results)
            
            # Format results
            formatted_results = []
            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                    formatted_results.append({
                        'content': results['documents'][0][i],
                        'metadata': metadata,
                        'pdf_id': metadata.get('pdf_id'),
                        'similarity_score': results['distances'][0][i] if results['distances'] else 0.0
                    })
                    print(f"Found similar chunk: {formatted_results[-1]}")
            else:
                print("No similar chunks found")
            return formatted_results
            
        except Exception as e:
            print(f"❌ Vector store search error: {e}")
            return []
    
    def add_documents(self, chat_id: int, documents: List[Dict]):
        """Add documents to ChromaDB"""
        try:
            collection = self.get_or_create_collection(chat_id)
            
            texts = [doc['content'] for doc in documents]
            metadatas = [doc['metadata'] for doc in documents]
            ids = [f"doc_{i}_{doc['metadata'].get('chunk_id', i)}" for i, doc in enumerate(documents)]
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(texts).tolist()
            
            # Clear existing data and add new
            try:
                collection.delete()
                collection = self.client.create_collection(self.get_collection_name(chat_id))
            except:
                pass
            
            # Add to ChromaDB
            collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            print(f"✅ Added {len(documents)} documents to vector store")
            
        except Exception as e:
            print(f"❌ Error adding documents to vector store: {e}")
            raise

class LLMService:
    """LLM service supporting Groq and Gemini"""
    
    def __init__(self, provider: str = "groq"):
        self.provider = provider
        self.client = self._initialize_client()
    
    def _initialize_client(self):
        if self.provider == "groq" and GROQ_AVAILABLE:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY not found in environment")
            
            # Use the raw Groq client, not ChatGroq
            return Groq(api_key=api_key)
        
        elif self.provider == "gemini" and GEMINI_AVAILABLE:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment")
            genai.configure(api_key=api_key)
            return genai.GenerativeModel('gemini-2.5-flash')
        
        else:
            raise ValueError(f"LLM provider '{self.provider}' not available or not supported")
    
    def generate(self, context: str, query: str, description: str) -> str:
        """Generate response using the configured LLM"""
        try:
            prompt = f"""
                        You are a helpful assistant answering questions based on the provided PDF document excerpts.

                        Instructions:
                        1. Use ONLY the information in the 'Context' to answer the 'Question'. 
                        2. If the answer is not present or cannot be inferred from the context, explicitly say: "The answer is not available in the provided documents."
                        3. First, identify the 'Theme' of the conversation from the provided theme description.
                        4. Respond in a tone, style, and format consistent with the identified theme.
                        5. If the user requests a specific format in the theme, strictly follow it.

                        Context:
                        {context}

                        Question:
                        {query}

                        Theme:
                        {description}

                        Answer:
                        """

            if self.provider == "groq":
                response = self.client.chat.completions.create(
                    model="qwen/qwen3-32b",  # Use a valid Groq model
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=1024
                )
                return response.choices[0].message.content
            
            elif self.provider == "gemini":
                response = self.client.generate_content(prompt)
                return response.text
                
        except Exception as e:
            return f"Error generating response: {str(e)}"

class RAGService:
    """Complete RAG service with ChromaDB and LLM integration"""
    
    def __init__(self, llm_provider: str = "groq"):
        print("🔄 Initializing RAG service...")
        
        # Initialize vector store
        self.vector_store = VectorStore()
        print("✅ Vector store initialized")
        
        # Initialize LLM
        try:
            self.llm = LLMService(provider=llm_provider)
            print(f"✅ LLM service initialized ({llm_provider})")
        except Exception as e:
            print(f"❌ LLM initialization failed: {e}")
            # Fallback to simple responses
            self.llm = None
    
    def _get_documents_from_db(self, chat_id: int) -> List[Dict]:
        """Get document chunks from database"""
        try:
            chunks = db.session.query(DocumentChunk).join(PDF).filter(
                PDF.chat_id == chat_id
            ).all()
            
            print(f"🔍 Found {len(chunks)} chunks in database for chat {chat_id}")
            
            documents = []
            for chunk in chunks:
                documents.append({
                    'content': chunk.content,
                    'metadata': {
                        'chunk_id': chunk.id,
                        'pdf_id': chunk.pdf_id,
                        'chunk_index': chunk.chunk_index,
                        **(chunk.details or {})  # Use 'details' field instead of 'metadata'
                    }
                })
            
            return documents
        except Exception as e:
            print(f"❌ Database error: {e}")
            return []
    
    def _ensure_vector_store_ready(self, chat_id: int):
        """Ensure vector store has documents for this chat"""
        try:
            # Test if vector store has data
            test_results = self.vector_store.search_similar_chunks(chat_id, "test", k=1)
            
            if not test_results:
                print("🔄 Vector store empty, rebuilding from database...")
                documents = self._get_documents_from_db(chat_id)
                
                if documents:
                    self.vector_store.add_documents(chat_id, documents)
                    print(f"✅ Rebuilt vector store with {len(documents)} documents")
                else:
                    print("❌ No documents found in database")
                    
        except Exception as e:
            print(f"❌ Error ensuring vector store ready: {e}")
    
    def generate_response_with_sources(self, chat_id: int, user_query: str) -> Dict:
        """Generate response with source attribution"""
        try:
            print(f"🔄 Processing query: {user_query[:50]}...")
            
            # Ensure vector store is ready
            self._ensure_vector_store_ready(chat_id)
            
            # 1. Retrieve relevant chunks with metadata
            relevant_chunks = self.vector_store.search_similar_chunks(chat_id, user_query, k=5)
            print(relevant_chunks)
            if not relevant_chunks:
                return {
                    'response': "I couldn't find any relevant information in the uploaded documents for your question.",
                    'sources': [],
                    'context_used': 0
                }
            
            # 2. Extract context and source info
            context_parts = []
            sources = []
            
            for chunk in relevant_chunks:
                context_parts.append(chunk['content'])
                metadata = chunk.get('metadata', {})
                if metadata.get('page'):
                    sources.append({
                        'page': metadata['page'],
                        'pdf_id': chunk['pdf_id'],
                        'similarity_score': chunk.get('similarity_score', 0)
                    })
            
            # 3. Generate AI response
            context = "\n\n".join(context_parts)
            chat_description = ChatSession.query.filter_by(id=chat_id).first().description if chat_id else "default theme"
            
            if self.llm:
                ai_response = self.llm.generate(context, user_query, description=chat_description)
            else:
                ai_response = "AI service is currently unavailable. Here's the relevant context I found:\n\n" + context[:500] + "..."
            
            # 4. Format response with sources
            if sources:
                source_text = "\n\n**Sources:**\n" + "\n".join([
                    f"📄 Page {source['page']}" for source in sources[:2]
                ])
                formatted_response = ai_response + source_text
            else:
                formatted_response = ai_response
            
            return {
                'response': formatted_response,
                'sources': sources,
                'context_used': len(context_parts)
            }
            
        except Exception as e:
            print(f"❌ RAG error: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                'response': f"I encountered an error while processing your question: {str(e)}",
                'sources': [],
                'context_used': 0
            }
    
    def generate_response(self, chat_id: int, user_query: str) -> str:
        """Generate simple response (compatibility method)"""
        result = self.generate_response_with_sources(chat_id, user_query)
        return result['response']
    
    def get_status(self, chat_id: int) -> Dict:
        """Get RAG service status"""
        try:
            documents = self._get_documents_from_db(chat_id)
            vector_results = self.vector_store.search_similar_chunks(chat_id, "test", k=1)
            
            return {
                'documents_in_db': len(documents),
                'vector_store_ready': len(vector_results) > 0,
                'llm_ready': self.llm is not None,
                'status': 'ready' if documents and self.llm else 'not_ready'
            }
        except Exception as e:
            return {
                'documents_in_db': 0,
                'vector_store_ready': False,
                'llm_ready': False,
                'status': 'error',
                'error': str(e)
            }