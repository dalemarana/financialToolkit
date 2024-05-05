import os
import pytest
from flask import url_for, request, flash

FILE_PATH = os.path.join(os.path.dirname(__file__), 'test_files', 'valid.pdf')

## Test for Amex - credit card
def test_upload_valid_pdf(client, auth, app):
    auth.login()
    with open(FILE_PATH, 'rb') as file:
        with app.test_request_context():
            response = client.post(
                url_for('fileman.upload'),
                data={'file': file, 'card_provider': 'Amex', 'card_type': 'credit_card', 'date_format': 'mmm_DD', 'statement_year': '2023'}
            )
    assert response.status_code == 200
    # Check if the response contains the expected message in JSON format
    assert response.is_json
    data = response.get_json()
    assert 'message' in data
    assert '3 transactions added.' in data['message']


def test_file_upload_no_file_part(client, auth, app):
    auth.login()

    # Simulate a POST request without the 'file' part
    response = client.post(
        url_for('fileman.upload'),
        data={'card_provider': 'Amex', 'card_type': 'credit_card', 'date_format': 'mmm_DD', 'statement_year': '2023'},
        follow_redirects=True  # Ensure that client follows redirects
    )

    # Assert that 'No file part' flash message is present
    assert b'No selected file' in response.data


def test_file_upload_no_selected_file(client, auth, app):
    auth.login()

    # Simulate a POST request with an empty 'file' filename
    response = client.post(
        url_for('fileman.upload'),
        data={'file': '', 'card_provider': 'Amex', 'card_type': 'credit_card', 'date_format': 'mmm_DD', 'statement_year': '2023'},
        follow_redirects=True  # Ensure that client follows redirects
    )

    # Assert that 'No selected file' flash message is present
    print(response.data)
    assert b'No selected file' in response.data


def test_file_upload_exceeds_limit(client, auth, app):
    auth.login()

    # Create a temporary file exceeding the maximum content length
    with open('large_file.pdf', 'wb') as large_file:
        large_file.write(b'a' * (app.config['MAX_CONTENT_LENGTH'] + 1))

    # Simulate a POST request with a file exceeding the maximum content length
    with open('large_file.pdf', 'rb') as file:
        response = client.post(
            url_for('fileman.upload'),
            data={'file': file, 'card_provider': 'Amex', 'card_type': 'credit_card', 'date_format': 'mmm_DD', 'statement_year': '2023'},
            follow_redirects=True  # Ensure that client follows redirects
        )

    os.remove('large_file.pdf')  # Clean up temporary file

    # Assert that 'File exceeds the allowed limit.' flash message is present
    assert b'The data value transmitted exceeds the capacity limit.' in response.data

# Add more tests to cover the remaining conditions...
