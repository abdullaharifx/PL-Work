from flask import Blueprint, render_template, request, redirect, url_for, flash
from models.user import User
from app import db

bp = Blueprint('register', __name__, url_prefix='/register')

@bp.route('/', methods=['GET', 'POST'])
def register_view():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        if not username or not email or not password:
            flash('All fields are required!', 'error')
            return render_template('auth/register.html')

        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'error')
            return render_template('auth/register.html')

        if User.query.filter_by(username=username).first():
            flash('Username already taken!', 'error')
            return render_template('auth/register.html')

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login.login_view'))

    return render_template('auth/register.html')
