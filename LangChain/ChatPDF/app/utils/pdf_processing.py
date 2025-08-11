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
        print(f"🔄 Starting PDF processing for {pdf_path}")
        
        # Extract text from PDF
        pages_content = self.extract_text_from_pdf(pdf_path)
        
        if not pages_content:
            print("❌ No pages content extracted")
            return []
        
        print(f"✅ Extracted {len(pages_content)} pages from PDF")
        
        # Chunk the documents
        chunks = self.chunk_documents(pages_content)
        print(f"✅ Created {len(chunks)} chunks from pages")
        
        # Save chunks to database
        document_chunks = []
        for idx, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                pdf_id=pdf_id,
                chunk_index=idx,
                content=chunk.page_content,
                details=chunk.metadata  # Use 'details' field instead of 'metadata'
            )
            db.session.add(db_chunk)
            document_chunks.append(db_chunk)
        
        db.session.commit()
        print(f"✅ Saved {len(document_chunks)} chunks to database")
        return document_chunks

def process_new_pdf(pdf_id: int, chat_id: int) -> bool:
    """
    Process a newly uploaded PDF file using PDFProcessor
    
    Args:
        pdf_id: ID of the PDF record in database
        chat_id: ID of the chat session
        
    Returns:
        True if processing successful, False otherwise
    """
    try:
        # Get PDF record from database
        pdf = PDF.query.get(pdf_id)
        if not pdf:
            print(f"PDF with ID {pdf_id} not found")
            return False
        
        # Construct file path
        from app.controllers.file_upload import UPLOAD_FOLDER
        filepath = os.path.join(UPLOAD_FOLDER, pdf.filename)
        
        # Check if file exists
        if not os.path.exists(filepath):
            print(f"PDF file not found at path: {filepath}")
            return False
        
        # Initialize PDF processor
        processor = PDFProcessor()
        
        # Process PDF and save chunks
        print(f"🔄 Processing PDF: {pdf.filename}")
        chunks = processor.process_pdf_file(filepath, pdf_id)
        
        if chunks:
            print(f"✅ Successfully processed PDF: {pdf.filename}")
            print(f"✅ Created {len(chunks)} chunks for PDF {pdf_id}")
            
            # Update PDF record with processing status
            pdf.processed = True
            pdf.chunks_count = len(chunks)
            pdf.pages_count = len(processor.extract_text_from_pdf(filepath))
            db.session.commit()
            
            # Initialize vector store for this chat
            try:
                from app.utils.langchain_pipeline import RAGService
                rag_service = RAGService()
                rag_service._force_rebuild_vector_store(chat_id)
                print(f"✅ Vector store completely rebuilt for chat {chat_id}")
                rag_service._ensure_vector_store_ready(chat_id)
                print(f"✅ Vector store updated for chat {chat_id}")
            except Exception as e:
                print(f"⚠️ Vector store update failed: {e}")
            
            return True
        else:
            print(f"❌ Failed to process PDF: {pdf.filename}")
            return False
            
    except Exception as e:
        print(f"❌ Error processing PDF {pdf_id}: {str(e)}")
        return False