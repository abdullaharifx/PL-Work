# controllers/auth/utils.py

from functools import wraps
from flask import session, redirect, url_for, flash

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login.login_view'))
        return f(*args, **kwargs)
    return decorated_function

def current_user():
    from models.user import User
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None