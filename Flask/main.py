# integrating html with flask and jinja 2 techniques
# http verbs like get and post
from flask import Flask, redirect, url_for, render_template, request
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
@app.route('/contact')
def contact():
    return "This is the contact page."
@app.route('/<name>')
def user(name):
    return f"Hello, {name}!"
@app.route('/<int:id>')
def user_id(id):
    return f"User ID: {id}"
@app.route('/form', methods=['POST', 'GET'])
def form():
    if request.method == 'POST':
        name = request.form['name']
        return f"Submitted name: {name}"
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
    