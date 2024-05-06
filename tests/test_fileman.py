import os
import json
import tempfile
from unittest.mock import MagicMock, patch
from flask import url_for, request, flash
import pytest

from finassist_f import fileman

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


## Test for no selected file. Though code checks are integrated on the front end code
def test_file_upload_no_file_part(client, auth, app):
    auth.login()

    # Create an example PDF file with invalid date format
    pdf_content = "Invalid Date Format"
    with open('example.pdf', 'w') as pdf_file:
        pdf_file.write(pdf_content)

    # Simulate a POST request without the 'file' part
    response = client.post(
        url_for('fileman.upload'),
        data={'card_provider': 'Amex', 'card_type': 'credit_card', 'date_format': 'mmm_DD', 'statement_year': '2023'},
        follow_redirects=True  # Ensure that client follows redirects
    )

    # Assert that 'No file part' flash message is present
    assert b'No selected file' in response.data


## Test for no selected file. Though code checks are integrated on the front end code
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


## Test to check if file upload exceeds the limit. Though code checks are integrated on the front end code
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


## Test to check if user uploads a non-pdf file
def test_file_upload_non_pdf_file(client, auth, app):
    auth.login()

    # Create a temporary non-PDF file
    with open('non_pdf_file.txt', 'w') as non_pdf_file:
        non_pdf_file.write('This is a non-PDF file.')

    # Simulate a POST request with a non-PDF file
    with open('non_pdf_file.txt', 'rb') as non_pdf_file:
        response = client.post(
            url_for('fileman.upload'),
            data={'file': (non_pdf_file, 'non_pdf_file.txt'), 'card_provider': 'Amex', 'card_type': 'credit_card', 'date_format': 'mmm_DD', 'statement_year': '2023'},
            follow_redirects=True  # Ensure that client follows redirects
        )

    # Parse the JSON response
    response_data = json.loads(response.data)

    # Assert that the error message is present in the JSON response
    assert 'error' in response_data
    assert response_data['error'] == 'Upload Error.'

    # Clean up: Delete the temporary non-PDF file
    os.remove('non_pdf_file.txt')
    

## Test to check ValueError -- For second checking on the whole function
# Revise the test to use a temporary PDF file
def test_pdfparse_value_error(client, auth, app):
    auth.login()

    # Create a temporary PDF file with invalid content
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
        temp_pdf.write(b"Invalid Date Format")

    # Mock a PDF file with an invalid date format
    pdf_mock = MagicMock()
    pdf_mock.pages.__iter__.return_value = [MagicMock(extract_text=lambda: "Invalid Date Format")]

    # Patch pdfplumber.open within the fileman module
    with patch('finassist_f.fileman.pdfplumber.open', return_value=pdf_mock):
        # Simulate a POST request with the temporary PDF file
        with open(temp_pdf.name, 'rb') as pdf_file:
            try:
                response = client.post(
                    url_for('fileman.upload'),
                    data={'file': (pdf_file, 'example.pdf'), 'card_provider': 'Amex', 'card_type': 'credit_card', 'date_format': 'invalid_format', 'statement_year': '2023'},
                    follow_redirects=True  # Ensure that client follows redirects
                )
            except ValueError as e:
                # Check if the exception is due to invalid date format
                assert str(e) == 'Invalid date format'

    # print(response.data)
    # Assert that the response contains the appropriate error message
    assert b'Invalid' in response.data
    os.remove('example.pdf')

    # Delete the temporary PDF file after the test
    os.unlink(temp_pdf.name)

# Add more tests to cover the remaining conditions...
