import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from chromadb import Client
import google.generativeai as genai

# Set your API key (make sure this is set in your environment or replace here)
import dotenv
dotenv.load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Configure Chroma DB
chroma_client = Client()
chroma_collection = chroma_client.get_or_create_collection(name="pdf-chat")

def process_pdf_file(filepath, chat_id, pdf_id):
    reader = PdfReader(filepath)
    pages = reader.pages

    data_chunks = []
    for i, page in enumerate(pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            data_chunks.append((i, text))

    # Chunk the text
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_chunks = []
    for page_number, page_text in data_chunks:
        splits = splitter.split_text(page_text)
        for chunk in splits:
            all_chunks.append({
                "page": page_number,
                "text": chunk
            })

    documents = [chunk["text"] for chunk in all_chunks]
    metadatas = [{"page_number": chunk["page"], "chat_id": str(chat_id), "pdf_id": str(pdf_id)} for chunk in all_chunks]

    # Get Gemini embedding model
    embedding_model = genai.get_model("models/embedding-001")

    # Embed documents
    embeddings = embedding_model.embed_content(
        model="models/embedding-001",
        content=documents,
        task_type="retrieval_document"
    )["embedding"]  # Ensure you access the correct field

    # Chroma expects a list of embeddings; loop if necessary
    if not isinstance(embeddings[0], list):  # Only one embedding?
        embeddings = [embeddings]

    # Generate unique IDs for chunks
    ids = [f"{pdf_id}_{i}" for i in range(len(documents))]

    # Add to Chroma
    chroma_collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings
    )
