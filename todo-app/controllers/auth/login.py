# controllers/auth/login.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from models.user import User

bp = Blueprint('login', __name__, url_prefix='/login')

@bp.route('/login', methods=['GET', 'POST'])
def login_view():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash(f'Welcome back, {user.username}!', 'success')
            return redirect(url_for('dashboard.dashboard_view'))
        else:
            flash('Invalid email or password!', 'error')

    return render_template('auth/login.html')
