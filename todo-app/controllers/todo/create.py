from flask import Blueprint, render_template, request, redirect, session, flash, url_for
from models.todo import Todo
from app import db
from controllers.auth.utils import login_required  # ✅ Import directly

bp = Blueprint('create', __name__, url_prefix='/todo')

@bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        if not title or not description:
            flash('Both title and description are required!', 'error')
            return render_template('todo/create.html')
        todo = Todo(title=title, description=description, user_id=session['user_id'])
        db.session.add(todo)
        db.session.commit()
        flash('Todo created!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    return render_template('todo/create.html')
