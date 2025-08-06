from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from app.models.chat import ChatSession
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

        new_chat = ChatSession( 
            title=title,
            description=description,
            user_id=session['user_id']
        )

        db.session.add(new_chat)
        db.session.commit()

        flash('Chat created successfully!', 'success')
        return redirect(url_for('dashboard.dashboard_view'))

    return render_template('chat/create.html')
