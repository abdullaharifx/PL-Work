# integrating html with flask and jinja 2 techniques
# http verbs like get and post

'''
{%...%} is used for control flow
{{...}} is used for expressions
{#...#} is used for comments
{{ name }} is used to print variables
{{ name|escape }} is used to escape variables
{{ name|safe }} is used to mark variables as safe
{{ name|length }} is used to get the length of a variable
{{ name|lower }} is used to convert a variable to lowercase
{{ name|upper }} is used to convert a variable to uppercase
{{ name|capitalize }} is used to capitalize a variable
{{ name|title }} is used to convert a variable to title case
{{ name|default('default value') }} is used to set a default value for a variable
{{ name|default_if_none('default value') }} is used to set a default value for a variable if it is None
{{ name|join(', ') }} is used to join a list of variables with a comma
{{ name|replace('old', 'new') }} is used to replace a substring in a
variable
{{ name|length }} is used to get the length of a variable
{{ name|sort }} is used to sort a list of variables
{{ name|reverse }} is used to reverse a list of variables
{{ name|random }} is used to get a random variable from a list
{{ name|random(3) }} is used to get 3 random variables from a list
{{ name|random(3, 'default value') }} is used to get 3 random variables from a list with a default value
{{ name|random(3, 'default value', 'default value 2') }} is used to get 3 random variables from a list with two default values
to update variable
{{ name|replace('old', 'new') }} is used to replace a substring in a variable
{{ name|replace('old', 'new', 1) }} is used to replace the first occurrence of a substring in a variable
# to change a number from a = 10 to a = 20
{{ name|replace('10', '20') }} is used to change a number in a variable

'''




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
        tenth = (float(request.form['tenth']))
        twelfth = (float(request.form['twelfth']))
        grad = (float(request.form['grad']))  
        score = (tenth + twelfth + grad) / 3
        return render_template('result.html', score = score, name=name, roll=roll, tenth=tenth, twelfth=twelfth, grad=grad)
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
