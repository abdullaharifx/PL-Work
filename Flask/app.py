from flask import Flask
# wsgi application
app = Flask(__name__)

# from markupsafe import escape

@app.route("/")
def hello():
    return f"Hello!"
@app.route("/new/<int:num>")
def num_check(num):
    if num % 2 == 0:
        return f"{num} is even"
    else:
        return f"{num} is odd"
# main function
if __name__ == "__main__":
    app.run(debug=True)
    