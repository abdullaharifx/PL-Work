
from app.utils.langchain_pipeline import RAGService


rag_service = RAGService()
result = rag_service.generate_response_with_sources(chat_id=1, user_query="What is this document about?")
print(result)