"""
PDF document and chunk models.
Handles PDF metadata storage and text chunk management for vector search.
"""
from datetime import datetime
from app.extensions import db


class PDFDocument(db.Model):
    """
    PDF document metadata model.
    
    Attributes:
        id (int): Primary key
        filename (str): Original filename
        file_path (str): Storage path
        user_id (int): Foreign key to User
        total_pages (int): Number of pages in PDF
        file_size (int): File size in bytes
        upload_date (datetime): Upload timestamp
        processed (bool): Whether text extraction is complete
    """
    __tablename__ = 'pdf_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_pages = db.Column(db.Integer)
    file_size = db.Column(db.Integer)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    processed = db.Column(db.Boolean, default=False)
    
    # Relationships
    chunks = db.relationship('PDFChunk', backref='document', lazy=True, 
                           cascade='all, delete-orphan')
    
    def get_processing_status(self):
        """
        Get document processing status.
        
        Returns:
            str: Processing status description
        """
        if self.processed:
            chunk_count = len(self.chunks)
            return f"Processed - {chunk_count} chunks created"
        return "Processing..."
    
    def __repr__(self):
        return f'<PDFDocument {self.filename}>'


class PDFChunk(db.Model):
    """
    PDF text chunk model for vector storage.
    
    Attributes:
        id (int): Primary key
        document_id (int): Foreign key to PDFDocument
        page_number (int): Source page number
        chunk_index (int): Chunk order within page
        content (str): Extracted text content
        embedding_id (str): FAISS vector index ID
        created_at (datetime): Chunk creation timestamp
    """
    __tablename__ = 'pdf_chunks'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('pdf_documents.id'), nullable=False)
    page_number = db.Column(db.Integer, nullable=False)
    chunk_index = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    embedding_id = db.Column(db.String(100))  # FAISS index reference
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_source_info(self):
        """
        Get formatted source information for citations.
        
        Returns:
            str: Formatted source citation
        """
        return f"{self.document.filename} (Page {self.page_number})"
    
    def __repr__(self):
        return f'<PDFChunk {self.document.filename} p{self.page_number}>'
