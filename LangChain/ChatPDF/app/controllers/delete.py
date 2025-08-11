# File: app/controllers/delete.py
from flask import Blueprint, request, redirect, url_for, flash, session
from app.models.chat import ChatSession
from app.models.pdf import PDF
from app.models.document_chunk import DocumentChunk
from app.extensions import db
from app.utils.utils import login_required
import os

bp = Blueprint('delete', __name__, url_prefix='/delete')

@bp.route('/<int:chat_id>', methods=['GET', 'POST'])
@login_required
def delete_view(chat_id):
    """Delete a chat and all associated data"""
    try:
        # Get the chat session
        chat = ChatSession.query.get_or_404(chat_id)
        
        # Check if current user owns this chat
        if chat.user_id != session.get('user_id'):
            flash('Unauthorized to delete this chat!', 'error')
            return redirect(url_for('dashboard.dashboard_view'))
        
        chat_title = chat.title  # Store for success message
        
        # 🗑️ CLEANUP PDF FILES FROM DISK
        from app.controllers.file_upload import UPLOAD_FOLDER
        for pdf in chat.pdfs:
            if pdf.filename:
                file_path = os.path.join(UPLOAD_FOLDER, pdf.filename)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        print(f"✅ Deleted PDF file: {file_path}")
                    except Exception as e:
                        print(f"❌ Error deleting PDF file {file_path}: {e}")
        
        # 🗑️ CLEANUP VECTOR STORE COLLECTION
        try:
            from app.utils.langchain_pipeline import get_chroma_client
            client = get_chroma_client()
            collection_name = f"chat_{chat_id}"
            try:
                client.delete_collection(collection_name)
                print(f"✅ Deleted vector store collection: {collection_name}")
            except Exception:
                print(f"ℹ️ No vector store collection to delete: {collection_name}")
        except Exception as e:
            print(f"⚠️ Error cleaning up vector store: {e}")
        
        # 🗑️ DELETE CHAT (CASCADE HANDLES THE REST)
        # This will automatically delete:
        # - All Messages (cascade="all, delete-orphan")
        # - All PDFs (cascade="all, delete-orphan") 
        # - All DocumentChunks (ondelete='CASCADE' + relationship cascade)
        # - SystemPrompt (cascade="all, delete-orphan")
        db.session.delete(chat)
        db.session.commit()
        
        print(f"✅ Successfully deleted chat '{chat_title}' and all related data")
        flash(f'Chat "{chat_title}" and all related data deleted successfully!', 'success')
        return redirect(url_for('dashboard.dashboard_view'))
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting chat: {e}")
        import traceback
        traceback.print_exc()
        flash('Error deleting chat. Please try again.', 'error')
        return redirect(url_for('dashboard.dashboard_view'))