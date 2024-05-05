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

    # assert b"Home" in response.data
    # assert b"Upload" in response.data
    # assert b"Add" in response.data
    # assert b"Logout" in response.data
    # assert b"Table View" in response.data
    # assert b"Chart View" in response.data

    # print(response.data)


