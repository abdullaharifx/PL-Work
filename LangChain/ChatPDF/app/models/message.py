from datetime import datetime
from app.extensions import db

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)   # e.g., 'user', 'assistant', 'system'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)

    # Relationships
    chat = db.relationship("ChatSession", back_populates="messages")

    def __repr__(self):
        return f"<Message {self.role} @ {self.timestamp}>"
