import os
import pytest
from flask import url_for

## Test for Amex - credit card
def test_upload_valid_pdf(client, auth, app):
    auth.login()
    file_path = os.path.join(os.path.dirname(__file__), 'test_files', 'valid.pdf')
    with open(file_path, 'rb') as file:
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

# Add more test cases for different scenarios...
