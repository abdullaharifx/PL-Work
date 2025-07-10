from flask import Flask

app = Flask(__name__)

# from markupsafe import escape

@app.route("/")
def hello():
    return f"Hello!"
@app.route("/new")
def hello_2():
    return f"Hello, this is a new route!"
# main function
if __name__ == "__main__":
    app.run(debug=True)
    