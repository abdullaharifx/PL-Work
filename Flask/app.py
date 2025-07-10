from flask import Flask
# wsgi application
app = Flask(__name__)

# from markupsafe import escape

@app.route("/")
def hello():
    return f"Hello!"


@app.route("/check/<num>")
def check(num):
    try:
        num = int(num)
    except ValueError:
        return "Please provide a valid integer."
    
    if num < 0 and num % 2 == 0:
        return f"{num} is negative"
    elif num > 0 and num % 2 == 0:
        return f"{num} is positive"
    else:
        return "The number is zero"
    

@app.route("/recheck/<string:name>")
def name_check(name):
    if name.isalpha():
        return f"{name} is a valid name"
    else:
        return f"{name} is not a valid name, it should contain only letters"
@app.route("/new/<int:num>")
def num_check(num):
    bool a = False
    if num % 2 == 0:
        bool = True
    else:
        bool = False
        
    if(bool):
        return(redirect(url_for(check, num)))
    else:
        return(redirect(url_for(name_check, name=str(num))))
if __name__ == "__main__":
    app.run(debug=True)
    