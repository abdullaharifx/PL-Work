from flask import Flask, render_template, request, redirect, url_for, flash, session # type: ignore
from flask_sqlalchemy import SQLAlchemy # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash # type: ignore
from datetime import datetime
import os
from functools import wraps

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Models (moved here to avoid circular imports)
class User(db.Model):
    """User model for authentication and todo ownership"""
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    
    # Relationship to todos (one-to-many)
    todos = db.relationship('Todo', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and store password securely"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches stored hash"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Todo(db.Model):
    """Todo model representing individual tasks"""
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign key to user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def __repr__(self):
        return f'<Todo {self.title}>'

# Authentication decorator
def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    """Home page - redirects to dashboard if logged in, otherwise shows welcome"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Validation
        if not username or not email or not password:
            flash('All fields are required!', 'error')
            return render_template('register.html')
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(username=username).first():
            flash('Username already taken!', 'error')
            return render_template('register.html')
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # explaun: Check if user exists
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash(f'Welcome back, {user.username}!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password!', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard showing user's todos"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '', type=str)
    
    # Build query
    query = Todo.query.filter_by(user_id=session['user_id'])
    
    # Apply search filter
    if search:
        query = query.filter(
            (Todo.title.contains(search)) | 
            (Todo.description.contains(search))
        )
    
    # Paginate results
    todos = query.order_by(Todo.created_at.desc()).paginate(
        page=page, per_page=5, error_out=False
    )
    
    return render_template('dashboard.html', todos=todos, search=search)

@app.route('/create', methods=['GET', 'POST'])
@login_required
def create_todo():
    """Create a new todo"""
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        
        if not title or not description:
            flash('Both title and description are required!', 'error')
            return render_template('create_todo.html')
        
        todo = Todo(
            title=title,
            description=description,
            user_id=session['user_id']
        )
        
        db.session.add(todo)
        db.session.commit()
        
        flash('Todo created successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('create_todo.html')

@app.route('/edit/<int:todo_id>', methods=['GET', 'POST'])
@login_required
def edit_todo(todo_id):
    """Edit an existing todo"""
    todo = Todo.query.get_or_404(todo_id)
    
    # Ensure user owns this todo
    if todo.user_id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        
        if not (title and description):
            flash('Both title and description are required!', 'error')
            return render_template('edit_todo.html', todo=todo)
        
        todo.title = title
        todo.description = description
        
        db.session.commit()
        
        flash('Todo updated successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('edit_todo.html', todo=todo)

@app.route('/delete/<int:todo_id>')
@login_required
def delete_todo(todo_id):
    """Delete a todo"""
    todo = Todo.query.get_or_404(todo_id)
    
    # Ensure user owns this todo
    if todo.user_id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('dashboard'))
    
    db.session.delete(todo)
    db.session.commit()
    
    flash('Todo deleted successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/delete/<int:user_id>')
@login_required
def delete_user(user_id):
    """Delete a user"""
    user = User.query.get_or_404(user_id)
    
    # Ensure user owns this account
    if user.id != session['user_id']:
        flash('Unauthorized access!', 'error')
        return redirect(url_for('dashboard'))
    
    db.session.delete(user)
    db.session.commit()
    
    flash('Sad to see you go.', 'success')
    return redirect(url_for('dashboard'))
@app.route('/delete_account', methods=['GET', 'POST'])
@login_required
def delete_account():
    """Delete user account and all associated data"""
    if request.method == 'POST':
        # Get password confirmation for security
        password = request.form['password']
        confirmation = request.form['confirmation']
        
        # Get current user
        user = User.query.get(session['user_id'])
        
        # Verify password
        if not user.check_password(password):
            flash('Incorrect password!', 'error')
            return render_template('delete_account.html')
        
        # Verify confirmation text
        if confirmation.lower() != 'delete my account':
            flash('Please type "delete my account" to confirm!', 'error')
            return render_template('delete_account.html')
        
        # Delete user (todos will be automatically deleted due to cascade)
        db.session.delete(user)
        db.session.commit()
        
        # Clear session
        session.clear()
        
        flash('Your account has been permanently deleted.', 'info')
        return redirect(url_for('index'))
    
    return render_template('delete_account.html')
@app.route('/profile')
@login_required
def profile():
    """View user profile"""
    user = User.query.get(session['user_id'])
    todo_count = Todo.query.filter_by(user_id=session['user_id']).count()
    return render_template('profile.html', user=user, todo_count=todo_count)

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
