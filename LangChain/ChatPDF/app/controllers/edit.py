from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from app.models.chat import ChatSession
from app.extensions import db
from app.utils.utils import login_required

bp = Blueprint('edit', __name__)

@bp.route('/chat/<int:chat_id>', methods=['GET', 'POST'])
@login_required
def edit_view(chat_id):
    chat = ChatSession.query.get_or_404(chat_id)

    if chat.user_id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('dashboard.dashboard_view'))

    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        llm_model = request.form.get('llm_model', 'qwen/qwen3-32b')

        if not title or not description:
            flash('Both title and description are required!', 'error')
            return render_template('chat/edit.html', chat=chat)

        chat.title = title
        chat.description = description
        chat.llm_model = llm_model
        db.session.commit()

        flash('Chat updated successfully!', 'success')
        return redirect(url_for('chat_controller.view_chat', username=chat.user.username, chat_id=chat.id))

    return render_template('chat/edit.html', chat=chat)
