import pytest
from flask import g, session
from finassist_f.db import get_db


## Registration Test
def test_register(client, app):
    assert client.get('/auth/register').status_code == 200
    response = client.post(
        '/auth/register', 
        data={
            'username': 'test_user',
            'password': 'test_password',
            'confirmation': 'test_password',
            'email': 'test@example.com',
            'contact_number': '1234567890',
            'last_name': 'Doe',
            'first_name': 'Jane',
            'birth_date': '1990-01-01',
            'gender': 'Female',
            'nationality': 'American',
            'residence': 'New York',
            'occupation': 'Software Engineer',
            'consent': 'Yes'
        }
    )
    assert response.headers['Location'] == '/auth/login'

    with app.app_context():
        assert get_db().execute(
            "SELECT * FROM users WHERE username = 'test_user'",
        ).fetchone() is not None


## Registration Input Validation test
@pytest.mark.parametrize(('username', 'password', 'confirmation', 'email', 'contact_number', 'last_name', 'first_name', 'birth_date', 'gender', 'nationality', 'residence', 'occupation', 'consent', 'message'), (
    ('', '', '', '', '', '', '', '', '', '', '', '', '', b'All fields are required.'),
    ('a', '', '', '', '', '', '', '', '', '', '', '', '', b'All fields are required.'),
    ('a', 'a', '', '', '', '', '', '', '', '', '', '', '', b'Passwords do not match.'),
    ('user11', 'password1', 'password1', 'user1@example.com', '1234567890', 'Doe', 'Jane', '1990-01-01', 'Female', 'American', 'New York', 'Software Engineer', 'Yes', b'Username or email address is already registered.'),
))
def test_register_validate_input(
    client, username, password, confirmation, email, contact_number, 
    last_name, first_name, birth_date, gender, nationality, residence, 
    occupation, consent, message):
    response = client.post(
        '/auth/register',
        data={
            'username': username,
            'password': password,
            'confirmation': confirmation,
            'email': email,
            'contact_number': contact_number,
            'last_name': last_name,
            'first_name': first_name,
            'birth_date': birth_date,
            'gender': gender,
            'nationality': nationality,
            'residence': residence,
            'occupation': occupation,
            'consent': consent
        }
    )
    assert message in response.data


## Login Test
def test_login(client, auth):
    assert client.get('/auth/login').status_code == 200
    assert auth.login_called_count == 0
    response = auth.login()
    assert auth.login_called_count == 1

    print(response)
    assert response.status_code == 302
    assert response.headers['Location'] == '/'

    with client:
        client.get('/')
        assert session['user_id'] == 1
        assert g.user['username'] == 'test'


@pytest.mark.parametrize(('username', 'password', 'message'), (
    ('a', 'test', b'Incorrect username or password.'),
    ('test', 'a', b'Incorrect username or password.'),
))
def test_login_validate_input(auth, username, password, message):
    response = auth.login(username, password)
    print(message)
    assert message in response.data


## Logout Test
def test_logout(client, auth):
    auth.login()

    with client:
        auth.logout()
        assert 'user_id' not in session