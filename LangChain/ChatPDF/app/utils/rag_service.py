from typing import List, Dict, Optional, Generator
import time
from app.models.document_chunk import DocumentChunk
from app.models.pdf import PDF
from app.models.chat import ChatSession
from app.models.message import Message
from app.extensions import db

# ✅ IMPORT ONLY WHAT YOU NEED
from app.utils.vector_store_service import VectorStore
from app.utils.llm_service import LLMService

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
    # File: app/utils/langchain_pipeline.py
# Add this method to the RAGService class
    def _get_chat_history(self, chat_id: int, limit: int = 3) -> List[Dict[str, str]]:
        """Get recent chat history for context"""
        try:
            
            
            # Get last N messages (excluding the current user message being processed)
            recent_messages = (
                Message.query
                .filter_by(chat_id=chat_id)
                .order_by(Message.timestamp.desc())
                .limit(limit * 2)  # *2 because we have user + assistant pairs
                .all()
            )
            
            # Reverse to get chronological order
            recent_messages.reverse()
            
            # Format for LLM context
            history = []
            for msg in recent_messages:
                history.append({
                    "role": msg.role,
                    "content": msg.content[:500]  # Limit length to avoid token overflow
                })
            
            print(f"📚 Retrieved {len(history)} messages for context")
            return history
            
        except Exception as e:
            print(f"❌ Error getting chat history: {e}")
            return []
    def _force_rebuild_vector_store(self, chat_id: int):
        """
        Force complete rebuild of vector store for a chat from database
        This ensures all PDFs in the chat contribute to answers
        """
        try:
            print(f"🔄 Force rebuilding vector store for chat {chat_id}")
            
            # Get ALL document chunks for this chat from database
            documents = self._get_documents_from_db(chat_id)
            
            if not documents:
                print(f"❌ No documents found in database for chat {chat_id}")
                return
            
            print(f"📚 Found {len(documents)} total chunks from ALL PDFs in chat {chat_id}")
            
            # Force rebuild vector store with ALL documents
            self.vector_store.add_documents(chat_id, documents)
            
            print(f"✅ Vector store completely rebuilt with {len(documents)} chunks")
            
            # Verify the rebuild worked
            test_results = self.vector_store.search_similar_chunks(chat_id, "test", k=1)
            if test_results:
                print(f"✅ Vector store verification successful - {len(test_results)} chunks available")
            else:
                print(f"❌ Vector store verification failed - no chunks found")
                
        except Exception as e:
            print(f"❌ Error force rebuilding vector store: {e}")
            import traceback
            traceback.print_exc()







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
    # File: app/utils/langchain_pipeline.py
# Update _ensure_vector_store_ready method
    def generate_response_with_sources(self, chat_id: int, user_query: str) -> Dict:
        """Generate response with enhanced source information for clickable navigation"""
        try:
            print(f"🔄 Processing query: {user_query[:50]}...")
            
            # Get chat description as theme
            theme = ChatSession.query.filter_by(id=chat_id).first().description if chat_id else "default theme"
            print(f"🎭 Using chat description as theme: {theme}")
            
            # 📚 GET CHAT HISTORY FOR CONTEXT
            chat_history = self._get_chat_history(chat_id, limit=3)
            
            # Ensure vector store is ready
            self._ensure_vector_store_ready(chat_id)
            
            # 1. Retrieve relevant chunks with metadata
            relevant_chunks = self.vector_store.search_similar_chunks(chat_id, user_query, k=5)
            
            if not relevant_chunks:
                return {
                    'response': "I couldn't find any relevant information in the uploaded documents for your question.",
                    'sources': [],
                    'context_used': 0
                }
            
            # ✅ 2. Extract context and enhanced source info for clickable navigation
            context_parts = []
            sources = []
            
            for chunk in relevant_chunks:
                context_parts.append(chunk['content'])
                metadata = chunk.get('metadata', {})
                
                # ✅ Get PDF information for better source display
                pdf_id = chunk.get('pdf_id') or metadata.get('pdf_id')
                if pdf_id:
                    pdf = PDF.query.get(pdf_id)
                    if pdf:
                        source_info = {
                            'pdf_id': pdf_id,
                            'pdf_filename': pdf.filename,
                            'page_number': metadata.get('page', 1),
                            'similarity_score': chunk.get('similarity_score', 0),
                            'chunk_id': metadata.get('chunk_id', 0),
                            'chunk_content_preview': chunk['content'][:150] + "..." if len(chunk['content']) > 150 else chunk['content']
                        }
                        sources.append(source_info)
            
            # 3. Generate AI response with theme AND chat history
            context = "\n\n".join(context_parts)
            
            if self.llm:
                ai_response = self.llm.generate(context, user_query, theme, chat_history)  # 🔥 PASS CHAT HISTORY
            else:
                ai_response = "AI service is currently unavailable. Here's the relevant context I found:\n\n" + context[:500] + "..."
            
            # ✅ 4. Format response with clickable sources
            formatted_response = ai_response
            if sources:
                source_text = "\n\n**📚 Sources:**\n"
                for i, source in enumerate(sources[:1], 1):
                    # Create clickable HTML link instead of markdown
                    source_link = f'<a href="javascript:navigateToPage({source["pdf_id"]}, {source["page_number"]})" class="text-decoration-none text-primary"><i class="fas fa-link"></i> {source["pdf_filename"]} - Page {source["page_number"]}</a>'
                    source_text += f"• {source_link}\n"
                formatted_response = ai_response + source_text
            
            return {
                'response': formatted_response,
                'sources': sources[:3],  # Limit to top 3 sources
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

    def generate_streaming_response(self, chat_id: int, user_query: str) -> Generator[Dict, None, None]:
        """Generate streaming response with enhanced clickable sources"""
        try:
            print(f"🔄 Starting streaming for query: {user_query[:50]}...")
            
            # Get chat description as theme
            theme = ChatSession.query.filter_by(id=chat_id).first().description if chat_id else "default theme"
            print(f"🎭 Using theme: {theme}")
            
            # Get chat history for context
            chat_history = self._get_chat_history(chat_id, limit=3)
            
            # Ensure vector store is ready
            self._ensure_vector_store_ready(chat_id)
            
            # 1. Retrieve relevant chunks
            relevant_chunks = self.vector_store.search_similar_chunks(chat_id, user_query, k=5)
            
            if not relevant_chunks:
                yield {
                    'type': 'content',
                    'data': "I couldn't find any relevant information in the uploaded documents for your question.",
                    'final': True,
                    'sources': []
                }
                return
            
            # 2. Prepare enhanced source information
            context_parts = []
            sources = []
            
            for chunk in relevant_chunks:
                context_parts.append(chunk['content'])
                metadata = chunk.get('metadata', {})
                
                # Get PDF information for clickable sources
                pdf_id = chunk.get('pdf_id') or metadata.get('pdf_id')
                if pdf_id:
                    pdf = PDF.query.get(pdf_id)
                    if pdf:
                        source_info = {
                            'pdf_id': pdf_id,
                            'pdf_filename': pdf.filename,
                            'page_number': metadata.get('page', 1),
                            'similarity_score': chunk.get('similarity_score', 0),
                            'chunk_id': metadata.get('chunk_id', 0),
                            'chunk_content_preview': chunk['content'][:150] + "..." if len(chunk['content']) > 150 else chunk['content']
                        }
                        sources.append(source_info)
            
            # 3. Generate streaming AI response
            context = "\n\n".join(context_parts)
            
            if self.llm:
                # Stream the AI response
                response_parts = []
                for chunk in self.llm.generate_streaming(context, user_query, theme, chat_history):
                    response_parts.append(chunk)
                    yield {
                        'type': 'content',
                        'data': chunk,
                        'final': False
                    }
                    time.sleep(0.01)  # Small delay for better UX
                
                # Send enhanced sources with clickable links
                if sources:
                    source_data = []
                    for source in sources[:3]:
                        source_data.append({
                            'pdf_id': source['pdf_id'],
                            'pdf_filename': source['pdf_filename'],
                            'page_number': source['page_number'],
                            'similarity_score': source['similarity_score'],
                            'preview': source['chunk_content_preview']
                        })
                    
                    yield {
                        'type': 'sources',
                        'data': source_data,
                        'final': False
                    }
                
                # Final completion signal
                yield {
                    'type': 'complete',
                    'data': ''.join(response_parts),
                    'final': True,
                    'sources': sources[:3]
                }
                
            else:
                fallback_response = f"AI service unavailable. Context found from {len(context_parts)} sources."
                yield {
                    'type': 'content',
                    'data': fallback_response,
                    'final': True,
                    'sources': sources[:3]
                }
                
        except Exception as e:
            print(f"❌ Streaming error: {e}")
            yield {
                'type': 'error',
                'data': f"Error generating response: {str(e)}",
                'final': True,
                'sources': []
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