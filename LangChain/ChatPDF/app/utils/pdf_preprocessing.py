import os
from xmlrpc import client
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from chromadb import Client
import google.generativeai as genai

# Configure Chroma client (adjust if you use persistence)
chroma_client = Client()
chroma_collection = chroma_client.get_or_create_collection(name="pdf-chat")

def process_pdf_file(filepath, chat_id, pdf_id):
    # Open PDF and extract text with page metadata
    reader = PdfReader(filepath)
    pages = reader.pages

    data_chunks = []
    page_numbers = []

    for i, page in enumerate(pages, start=1):
        # Extract text from each page, strip extra whitespace
        text = page.extract_text() or ""
        text = text.strip()

        # You could store (page_number, text) pairs for chunking
        if text:
            data_chunks.append((i, text))

    # Chunk data with LangChain splitter
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_chunks = []

    for page_number, page_text in data_chunks:
        # Split text into chunks
        splits = splitter.split_text(page_text)

        # Attach page number metadata to each chunk
        for chunk in splits:
            all_chunks.append({
                "page": page_number,
                "text": chunk
            })

    # Instantiate your embedding model - replace with Gemini/Groq embeddings interface
    client = genai.Client()

    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents="What is the meaning of life?")

    print(result.embeddings)
    embedding_model = client.models.get("gemini-embedding-001")
    # Prepare documents for Chroma: list of dicts with metadata
    documents = [chunk["text"] for chunk in all_chunks]
    metadatas = [{"page_number": chunk["page"], "chat_id": str(chat_id), "pdf_id": str(pdf_id)} for chunk in all_chunks]

    # Generate embeddings and add to Chroma vector DB
    vectors = embedding_model.embed_documents(documents)
    # Upsert to Chroma - use unique ids per chunk
    ids = [f"{pdf_id}_{i}" for i in range(len(documents))]

    chroma_collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=vectors
    )

    # (Optional) persist Chroma DB if enabled
    # chroma_client.persist()


