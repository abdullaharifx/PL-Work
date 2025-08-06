from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from app.models.chat import ChatSession
from app.models.user import User
from app.extensions import db
from app.utils.utils import login_required

bp = Blueprint('create', __name__, url_prefix='/create')

@bp.route('/', methods=['GET', 'POST'])
@login_required
def create_view():
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']

        if not title or not description:
            flash('Both title and description are required!', 'error')
            return render_template('chat/create.html')

        # Create new chat session
        new_chat = ChatSession(
            title=title,
            description=description,
            user_id=session['user_id']
        )

        db.session.add(new_chat)
        db.session.commit()

        # Get the user for the redirect
        user = User.query.get(session['user_id'])

        flash('Chat created successfully!', 'success')
        # Redirect to the new chat session page
        return redirect(url_for('chat_controller.view_chat', username=user.username, chat_id=new_chat.id))

    return render_template('chat/create.html')
