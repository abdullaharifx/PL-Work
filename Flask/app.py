from flask import Flask, redirect, url_for
from markupsafe import escape
# wsgi application
app = Flask(__name__)

# from markupsafe import escape
# a funn app
@app.route('/')
def home():
    return "Welcome to the Flask App!"
@app.route('/redirect')
def redirect_example():
    return redirect(url_for('home'))
@app.route('/about')
def about():
    return "This is the about page."
@app.route('/contact/')
def contact():
    return "This is the contact page."
# @app.route('/<name>')
# def user(name):
#     return f"Hello, {escape(name)}!"
# @app.route('/<int:id>')
# def user_id(id):
#     return f"User ID: {escape(id)}"
@app.route('/new/<path:subpath>')
def subpath(subpath):
    return f"Subpath: {escape(subpath)}"
@app.route('/')
def index():
    return 'index'

@app.route('/login')
def login():
    return 'login'

@app.route('/user/<username>')
def profile(username):
    return f'{username}\'s profile'

with app.test_request_context():
    print(url_for('index'))
    print(url_for('login'))
    print(url_for('login', next='/'))
    print(url_for('profile', username='John Doe'))


if __name__ == "__main__":
    app.run(debug=True)
    