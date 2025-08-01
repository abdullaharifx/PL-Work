# import blueprints and register routes
  
def register_routes(app):
    from . import (
        index,
        login,
        logout,
        register,
        profile,
        dashboard,
        create,
        delete,
        edit,
    )

    app.register_blueprint(index.bp)
    app.register_blueprint(login.bp)
    app.register_blueprint(logout.bp)
    app.register_blueprint(register.bp)
    app.register_blueprint(profile.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(create.bp)
    app.register_blueprint(delete.bp)
    app.register_blueprint(edit.bp)
    return app