import os

from flask import Flask


def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'test.db'),
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # A simple page that says hello to check the app
    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    # Register db.py    
    from . import db
    db.init_app(app)

    # Register auth.py
    from . import auth
    app.register_blueprint(auth.bp)

    # Register dataman.py
    from . import dataman
    app.register_blueprint(dataman.bp)
    app.add_url_rule('/', endpoint='index')

    # Register fileman.py
    from . import fileman
    app.register_blueprint(fileman.bp)

    with app.app_context():
        fileman.configure_max_content_length()
    
    return app