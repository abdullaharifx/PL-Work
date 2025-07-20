
# Flask Todo App

A simple and intuitive Todo application built with Flask. This project demonstrates CRUD operations, template rendering, and static file management in Flask.

## Features

- Add, edit, and delete tasks
- Mark tasks as complete/incomplete
- Responsive UI using Bootstrap
- Persistent storage with SQLite

## Project Structure

```
todo-app
├── app
│  ├── controllers
│  │  ├── create.py
│  │  ├── dashboard.py
│  │  ├── delete.py
│  │  ├── edit.py
│  │  ├── index.py
│  │  ├── login.py
│  │  ├── logout.py
│  │  ├── profile.py
│  │  ├── register.py
│  │  └── __init__.py
│  ├── models
│  │  ├── todo.py
│  │  ├── user.py
│  │  └── __init__.py
│  ├── static
│  │  ├── css
│  │  │  └── custom.css
│  │  └── img
│  │     ├── main.png
│  │     └── todo.png
│  ├── templates
│  │  ├── auth
│  │  │  ├── login.html
│  │  │  └── register.html
│  │  ├── layout
│  │  │  ├── flash_msgs.html
│  │  │  └── navbar.html
│  │  ├── todo
│  │  │  ├── create.html
│  │  │  ├── dashboard.html
│  │  │  ├── edit.html
│  │  │  ├── list.html
│  │  │  ├── pagination.html
│  │  │  └── search.html
│  │  ├── user
│  │  │  ├── delete.html
│  │  │  └── profile.html
│  │  ├── base.html
│  │  └── index.html
│  ├── extensions.py
│  ├── utils.py
│  └── __init__.py
├── instance
│  └── todo.db
├── tests
│  ├── test_auth.py
│  ├── test_conf.py
│  └── test_models.py

```

## Screenshots

### Main

![Main](static/img/main.png)

### TODO List

![TODO List](static/img/todo.png)


## Getting Started

### Prerequisites

- Python 3.x installed on your system

### Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/AbdullAharifx/flask-todo-app.git
    cd flask-todo-app
    ```

2. **Create a virtual environment (optional but recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### Running the App

```bash
python app.py
```

Visit [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

## Folder Descriptions

- **app.py**: Main application file containing routes and logic.
- **templates/**: Contains HTML templates rendered by Flask.
- **static/**: Holds static assets like CSS and images.
- **requirements.txt**: Lists all Python dependencies for easy setup.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
