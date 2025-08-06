from datetime import datetime
from app.extensions import db
from app.models.chat import ChatSession

class PDF(db.Model):
    __tablename__ = "pdfs"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)

    # Relationships
    chat = db.relationship("ChatSession", back_populates="pdfs")

    def __repr__(self):
        return f"<PDF {self.filename} (Chat ID: {self.chat_id})>"
