# models/todo.py
from app.extensions import db
from datetime import datetime

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    
    # Relationships
    user = db.relationship("User", back_populates="chats")
    pdfs = db.relationship("PDF", back_populates="chat", cascade="all, delete-orphan")
    messages = db.relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    system_prompt = db.relationship("SystemPrompt", uselist=False, back_populates="chat", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<ChatSession {self.id} (User ID: {self.user_id})>"
