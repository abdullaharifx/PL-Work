from datetime import datetime
from app.extensions import db

class SystemPrompt(db.Model):
    __tablename__ = "system_prompts"
    id = db.Column(db.Integer, primary_key=True)
    prompt_text = db.Column(db.Text, nullable=False)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), unique=True, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chat = db.relationship("ChatSession", back_populates="system_prompt")

    def __repr__(self):
        return f"<SystemPrompt for Chat ID {self.chat_id}>"
