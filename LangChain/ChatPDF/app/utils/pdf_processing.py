import os
from typing import List, Dict
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from app.models.document_chunk import DocumentChunk
from app.models.pdf import PDF
from app.extensions import db

class PDFProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def extract_text_from_pdf(self, pdf_path: str) -> List[Dict]:
        """Extract text from PDF with page information"""
        try:
            reader = PdfReader(pdf_path)
            pages_content = []
            
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text.strip():
                    pages_content.append({
                        "page_number": page_num + 1,
                        "content": text,
                        "metadata": {
                            "page": page_num + 1,
                            "total_pages": len(reader.pages)
                        }
                    })
            
            return pages_content
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return []
    
    def chunk_documents(self, pages_content: List[Dict]) -> List[Document]:
        """Split pages into chunks"""
        documents = []
        
        for page_data in pages_content:
            # Create Document objects for each page
            doc = Document(
                page_content=page_data["content"],
                metadata=page_data["metadata"]
            )
            documents.append(doc)
        
        # Split documents into chunks
        chunks = self.text_splitter.split_documents(documents)
        return chunks
    
    def process_pdf_file(self, pdf_path: str, pdf_id: int) -> List[DocumentChunk]:
        """Complete PDF processing pipeline"""
        # Extract text from PDF
        pages_content = self.extract_text_from_pdf(pdf_path)
        
        if not pages_content:
            return []
        
        # Chunk the documents
        chunks = self.chunk_documents(pages_content)
        
        # Save chunks to database
        document_chunks = []
        for idx, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                pdf_id=pdf_id,
                chunk_index=idx,
                content=chunk.page_content,
                metadata=chunk.metadata
            )
            db.session.add(db_chunk)
            document_chunks.append(db_chunk)
        
        db.session.commit()
        return document_chunks