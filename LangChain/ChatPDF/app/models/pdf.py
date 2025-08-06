from datetime import datetime
from app.extensions import db

class PDF(db.Model):
    __tablename__ = "pdfs"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    # Relationships
    chat = db.relationship("ChatSession", back_populates="pdfs")
    user = db.relationship("User", back_populates="pdfs")
    def __init__(self, filename, chat_id, user_id):
        self.filename = filename
        self.chat_id = chat_id
        self.user_id = user_id
    def __repr__(self):
        return f"<PDF {self.filename} (Chat ID: {self.chat_id})>"
