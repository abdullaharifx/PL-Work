from app import app, db, User, Todo
from sqlalchemy import inspect

with app.app_context():
    inspector = inspect(db.engine)
    
    print("=== DATABASE SCHEMA ===\n")
    
    for table_name in inspector.get_table_names():
        print(f"Table: {table_name}")
        print("-" * 40)
        
        columns = inspector.get_columns(table_name)
        for column in columns:
            nullable = "NULL" if column['nullable'] else "NOT NULL"
            column_type = str(column['type'])  # Convert type to string
            print(f"  {column['name']:<15} {column_type:<20} {nullable}")
        
        # Show foreign keys
        fks = inspector.get_foreign_keys(table_name)
        if fks:
            print("  Foreign Keys:")
            for fk in fks:
                print(f"    {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
        
        print("\n")
    
    # Add data viewing section
    print("=== DATABASE DATA ===\n")
    
    # View Users
    users = User.query.all()
    print(f"Users ({len(users)} records):")
    print("-" * 50)
    if users:
        for user in users:
            print(f"  ID: {user.id}, Username: {user.username}, Email: {user.email}")
    else:
        print("  No users found")
    
    print()
    
    # View Todos
    todos = Todo.query.all()
    print(f"Todos ({len(todos)} records):")
    print("-" * 50)
    if todos:
        for todo in todos:
            print(f"  ID: {todo.id}, Title: {todo.title}, User ID: {todo.user_id}")
            print(f"      Description: {todo.description}")
            print(f"      Created: {todo.created_at}")
            print()
    else:
        print("  No todos found")