import os
import chromadb
from typing import List, Dict
from sentence_transformers import SentenceTransformer

# from app.utils.llm_service import LLMService
# from app.utils.rag_service import RagService

from app.models.document_chunk import DocumentChunk
from app.models.pdf import PDF
from app.models.chat import ChatSession
from app.models.message import Message
from app.extensions import db




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
    
    # def add_documents(self, chat_id: int, documents: List[Dict]):
    #     """Add documents to ChromaDB"""
    #     try:
    #         collection = self.get_or_create_collection(chat_id)
            
    #         texts = [doc['content'] for doc in documents]
    #         metadatas = [doc['metadata'] for doc in documents]
    #         ids = [f"doc_{i}_{doc['metadata'].get('chunk_id', i)}" for i, doc in enumerate(documents)]
            
    #         # Generate embeddings
    #         embeddings = self.embedding_model.encode(texts).tolist()
            
    #         # Clear existing data and add new
    #         try:
    #             collection.delete()
    #             collection = self.client.create_collection(self.get_collection_name(chat_id))
    #         except:
    #             pass
            
    #         # Add to ChromaDB
    #         collection.add(
    #             documents=texts,
    #             embeddings=embeddings,
    #             metadatas=metadatas,
    #             ids=ids
    #         )
    #         print(f"✅ Added {len(documents)} documents to vector store")
            
    #     except Exception as e:
    #         print(f"❌ Error adding documents to vector store: {e}")
    #         raise
    # File: app/utils/langchain_pipeline.py
# Update the VectorStore.add_documents method

    def add_documents(self, chat_id: int, documents: List[Dict]):
        """Add documents to ChromaDB - replaces existing collection"""
        try:
            collection_name = self.get_collection_name(chat_id)
            
            # 🔥 ALWAYS DELETE EXISTING COLLECTION AND CREATE FRESH
            try:
                # Try to delete existing collection
                existing_collection = self.client.get_collection(collection_name)
                self.client.delete_collection(collection_name)
                print(f"🗑️ Deleted existing collection: {collection_name}")
            except Exception:
                print(f"ℹ️ No existing collection to delete: {collection_name}")
            
            # Create fresh collection
            collection = self.client.create_collection(collection_name)
            print(f"🆕 Created fresh collection: {collection_name}")
            
            if not documents:
                print("⚠️ No documents to add")
                return
            
            # Prepare data for ChromaDB
            texts = [doc['content'] for doc in documents]
            metadatas = [doc['metadata'] for doc in documents]
            ids = [f"doc_{i}_{doc['metadata'].get('chunk_id', i)}" for i, doc in enumerate(documents)]
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(texts).tolist()
            
            # Add ALL documents to fresh collection
            collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            
            print(f"✅ Added {len(documents)} documents to fresh vector store collection")
            
            # Show which PDFs contributed
            pdf_ids = set(doc['metadata'].get('pdf_id') for doc in documents)
            print(f"📄 Documents from {len(pdf_ids)} PDFs: {sorted(pdf_ids)}")
            
        except Exception as e:
            print(f"❌ Error adding documents to vector store: {e}")
            raise

