from datetime import datetime
from app.extensions import db

class DocumentChunk(db.Model):
    __tablename__ = "document_chunks"
    
    id = db.Column(db.Integer, primary_key=True)
    pdf_id = db.Column(db.Integer, db.ForeignKey("pdfs.id", ondelete='CASCADE'), nullable=False)
    chunk_index = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    details = db.Column(db.JSON)  # Store page numbers, chunk info, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    pdf = db.relationship("PDF", back_populates="chunks")
    
    def __repr__(self):
        return f"<DocumentChunk {self.id} (PDF: {self.pdf_id}, Index: {self.chunk_index})>"