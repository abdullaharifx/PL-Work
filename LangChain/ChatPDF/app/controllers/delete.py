from flask import Blueprint, redirect, url_for, session, flash
from app.models.chat import ChatSession
from app.extensions import db
from app.utils.utils import login_required

bp = Blueprint('delete', __name__, url_prefix='/delete')

@bp.route('/<int:chat_id>')
@login_required
def delete_view(chat_id):
    chat = ChatSession.query.get_or_404(chat_id)

    if chat.user_id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('dashboard.dashboard_view'))

    db.session.delete(chat)
    db.session.commit()

    flash('Chat deleted successfully!', 'success')
    return redirect(url_for('dashboard.dashboard_view'))
