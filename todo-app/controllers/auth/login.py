from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from models.user import User


bp = Blueprint('login', __name__, url_prefix='')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash(f'Welcome back, {user.username}!', 'success')
            return redirect(url_for('dashboard.dashboard'))
        flash('Invalid email or password!', 'error')
    return render_template('auth/login.html')

    
