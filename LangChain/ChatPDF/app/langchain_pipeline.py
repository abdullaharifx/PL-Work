from chromadb import Client
import os

def get_chroma_client():
    db_dir = os.getenv("CHROMA_DB_DIR", "./chroma_db")
    client = Client()
    # This is an example; adapt as per your Chroma usage for persistence:
    collection = client.get_or_create_collection(name="pdf-chat", persist_directory=db_dir)
    return collection
