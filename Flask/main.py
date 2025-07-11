# integrating html with flask and jinja 2 techniques
# http verbs like get and post
from flask import Flask, redirect, url_for, render_template, request
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
@app.route('/contact')
def contact():
    return "This is the contact page."
@app.route('/<naam>')
def user(naam):
    return f"Hello, {naam}!"
@app.route('/<int:id>')
def user_id(id):
    return f"User ID: {id}"
@app.route('/submit', methods=['POST', 'GET'])
def submit():
    if request.method == 'POST':
        name = escape(request.form['name'])
        roll = escape(request.form['roll'])
        tenth = escape(float(request.form['tenth']))
        twelfth = escape(float(request.form['twelfth']))
        grad = escape(float(request.form['grad']))  
        return redirect(url_for('res', name=name, roll=roll, tenth=tenth, twelfth=twelfth, grad=grad))
    return render_template('index.html')

@app.route('/result/<string:name>/<string:roll>/<float:tenth>/<float:twelfth>/<float:grad>')
def res(name, roll, tenth, twelfth, grad):
    
    score = 0.3*tenth + 0.3*twelfth + 0.4*grad
    if score >= 60:
        mesg = f"Name: {name}, Roll: {roll}, Your score is {score}. You are eligible for placement."
    else:
        mesg = f"Name: {name}, Roll: {roll}, Your score is {score}. You are not eligible for placement."
    return render_template('result.html', message=mesg)

if __name__ == "__main__":
    app.run(debug=True)
