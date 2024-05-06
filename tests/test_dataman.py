import pytest
from finassist_f.db import get_db

## Index Page Test Before and After Login
def test_index(client, auth):
    # Go to Index page and ask the user to login
    response = client.get('/')
    assert response.status_code == 302
    assert response.headers['Location'] == '/auth/login'

    # User Login
    auth.login()

    # Go to Index page
    response = client.get('/')
    assert response.status_code == 200

    assert b"Home" in response.data
    assert b"Upload" in response.data
    assert b"Add" in response.data
    assert b"Logout" in response.data
    assert b"Table View" in response.data
    assert b"Chart View" in response.data

    # print(response.data)

def test_index_with_no_transactions(client, app, auth):
    # Register a new user without any transactions
    response = client.post(
        '/auth/register', 
        data={
            'username': 'new_user',
            'password': 'new_password',
            'confirmation': 'new_password',
            'email': 'new_user@example.com',
            'contact_number': '1234567890',
            'last_name': 'Doe',
            'first_name': 'John',
            'birth_date': '1990-01-01',
            'gender': 'Male',
            'nationality': 'American',
            'residence': 'New York',
            'occupation': 'Software Engineer',
            'consent': 'Yes'
        }
    )
    assert response.headers['Location'] == '/auth/login'

    # Login with the newly registered user
    auth.login(username='new_user', password='new_password')

    # Go to Index page
    response = client.get('/')
    assert response.status_code == 200

    # Ensure that the page indicates no transactions
    assert b"<table>" not in response.data  # Assuming transactions are displayed in a table

