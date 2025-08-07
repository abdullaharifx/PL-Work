from datetime import datetime
from app.extensions import db

class PDF(db.Model):
    __tablename__ = "pdfs"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    processed = db.Column(db.Boolean, default=False)  # Track processing status
    file_path = db.Column(db.String(500))  # Store full file path
    pages_count = db.Column(db.Integer)  # Number of pages processed
    chunks_count = db.Column(db.Integer)  # Number of text chunks created

    # Relationships
    chat = db.relationship("ChatSession", back_populates="pdfs")
    user = db.relationship("User", back_populates="pdfs")
    # 🔥 ADD THIS RELATIONSHIP WITH CASCADE TO FIX DELETION ERROR
    chunks = db.relationship("DocumentChunk", back_populates="pdf", cascade="all, delete-orphan")
    def __init__(self, filename, chat_id, user_id):
        self.filename = filename
        self.chat_id = chat_id
        self.user_id = user_id
    def __repr__(self):
        return f"<PDF {self.filename} (Chat ID: {self.chat_id})>"
