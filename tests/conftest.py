import os
import tempfile

import pytest
from finassist_f import create_app
from finassist_f.db import get_db, init_db

with open(os.path.join(os.path.dirname(__file__), 'data.sql'), 'rb') as f:
    _data_sql = f.read().decode('utf8')


@pytest.fixture
def app():
    db_fd, db_path = tempfile.mkstemp()

    app = create_app({
        'TESTING': True,
        'DATABASE': db_path,
       'WTF_CSRF_ENABLED': False,  # Disable CSRF protection for testing
    })

    with app.app_context():
        init_db()
        get_db().executescript(_data_sql)

    yield app

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    # Ensure the client handles file uploads and follows redirects
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    client = app.test_client()
    return client

@pytest.fixture
def runner(app):
    return app.test_cli_runner()


class AuthActions(object):
    def __init__(self, client):
        self._client = client
        self.login_called_count = 0

    def login(self, username='test', password='test'):
        self.login_called_count += 1
        return self._client.post(
            '/auth/login',
            data={'username': username, 'password': password}
        )
    
    def logout(self):
        return self._client.get('/auth/logout')
    
@pytest.fixture
def auth(client):
    return AuthActions(client)