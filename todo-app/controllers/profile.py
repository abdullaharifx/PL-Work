from flask import Blueprint, render_template, session, flash, request, redirect, url_for
from models.user import User
from models.todo import Todo
from app import db
from controllers.auth.utils import login_required

bp = Blueprint('profile', __name__, url_prefix='/profile')

@bp.route('/')
@login_required
def profile_view():
    user = User.query.get(session['user_id'])
    todo_count = Todo.query.filter_by(user_id=user.id).count()
    return render_template('user/profile.html', user=user, todo_count=todo_count)

@bp.route('/delete_account', methods=['GET', 'POST'])
@login_required
def delete_account_view():
    user = User.query.get(session['user_id'])

    if request.method == 'POST':
        password = request.form['password']
        confirmation = request.form['confirmation']

        if not user.check_password(password):
            flash('Incorrect password!', 'error')
            return render_template('user/delete.html')

        if confirmation.lower() != 'delete my account':
            flash('Please type "delete my account" to confirm!', 'error')
            return render_template('user/delete.html')

        db.session.delete(user)
        db.session.commit()
        session.clear()

        flash('Your account has been permanently deleted.', 'info')
        return redirect(url_for('index.index_view'))

    return render_template('delete_account.html')
