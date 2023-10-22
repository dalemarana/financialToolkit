from flask import (
    Blueprint, flash, g, redirect, request, render_template, current_app, url_for, jsonify
)

import os
import re
import pdfplumber

from datetime import datetime
from magic import from_buffer
from werkzeug.utils import secure_filename


from finassist_f.auth import login_required
from finassist_f.db import get_db

ALLOWED_EXTENSIONS = {'pdf'}

DATE_PATTERN = {
    'mmm_DD':[r'[A-Za-z]{3}\d{1,2}', '%b%d'], 
    'DD-mmm-YYYY': [r'\d{1,2}-[A-Za-z]{3}-\d{4}', '%d-%b-%Y'], 
    'DD_mmm': [r'\d{1,2} [A-Za-z]{3}', '%d_%b']
}

PAYMENT_PHRASE = [
    'payment', 
    'cashback',
    'thank you',
    'received'
]

bp = Blueprint('fileman', __name__, url_prefix='/fileman')

def configure_max_content_length():
    # Set a maximum file size limit 
    current_app.config['MAX_CONTENT_LENGTH'] = 4 * 1024 * 1024



# Define a route: for GET - display file upload form, 
#                 for POST - handle the file upload
@bp.route('/upload', methods=('GET', 'POST'))
@login_required
def upload():

    # Provide options for card_providers
    db = get_db()

    transactions = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'        
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' ORDER BY transaction_date DESC', (g.user['id'], )
    ).fetchall()

    card_provider_set = set([row['card_provider'] for row in transactions])

    if request.method == 'POST':
        # Check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        
        # If the user does not select a file, the browser submits an
        # empty file without a filename
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)

        
        # Check if the file size is within the allowed limit
        if len(file.read()) > current_app.config['MAX_CONTENT_LENGTH']:
            flash('File exceeds the allowed limit.')
            return redirect(request.url)

        # Check if file is pdf
        if allowed_file(file.filename):
            # Check pdf signature
            file.seek(0)
            file_type = from_buffer(file.read(2048))
            
            if 'PDF document' not in file_type:
                flash('File is not pdf.')
                return redirect(request.url)

            # Insert the file into the database
            card_provider = (request.form['card_provider']).upper()
            card_type = request.form['card_type']

            db = get_db()

            log_id = db.execute(
                'SELECT id FROM log_sessions WHERE user_id = ? '
                ' ORDER BY login_timestamp DESC', (g.user['id'],)
            ).fetchone()

            db.execute(
                'INSERT INTO files (filename, log_session_id, card_provider, card_type)'
                ' VALUES (?, ?, ?, ?)', (file.filename, log_id['id'], card_provider, card_type)
            )
            db.commit()

            # Check if card provider is in item_types

            if card_type == 'credit_card':
                print('credit_card')
                card_provider_check = db.execute(
                    'SELECT * FROM sub_account_items WHERE item_type = ?', ('{} Credit Card -user{}'.format(card_provider, g.user['id']),)
                ).fetchone()
                
                # Add to item Types
                if card_provider_check is None:
                    db.execute(
                        'INSERT INTO sub_account_items (item_type, sub_account_type, balance_sheet_account_type, source)'
                        ' VALUES (?, ?, ?, ?)', ('{} Credit Card -user{}'.format(card_provider, g.user['id']), 'account_payables', 'liabilities', g.user['id'])
                    )
                    db.commit()
                else:
                    print('not ok')
                    pass

            elif card_type == 'debit_card':
                print('debit_card')
                card_provider_check = db.execute(
                    'SELECT * FROM sub_account_items WHERE item_type = ?', ('{} Debit Card -user{}'.format(card_provider, g.user['id']),)
                ).fetchone()

                if card_provider_check is None:
                    db.execute(
                        'INSERT INTO sub_account_items (item_type, sub_account_type, balance_sheet_account_type, source)'
                        ' VALUES (?, ?, ?, ?)', ('{} Debit Card -user{}'.format(card_provider, g.user['id']), 'cash', 'asset', g.user['id'])
                    )
                    db.commit()
                else:
                    print('not ok')
                    pass

            # Get the file_id
            file_id = db.execute(
                'SELECT files.id FROM files JOIN log_sessions ON files.log_session_id = log_sessions.id'
                ' WHERE log_sessions.id = ? ORDER BY files.id DESC', (log_id['id'],)
            ).fetchone()

                        
            # Process the uploaded file
            # Access the file using file.read()
            date_format = request.form['date_format']
            year = request.form['statement_year']
            pdfparse(file, file_id['id'], date_format, year)
            
            #print(file.filename)


            # After processing, close the file and delete it
            file.close()

            # Log into user logs
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (g.user['id'], 'FILE UPLOAD', '{} has been uploaded successfully'.format(file.filename))
            )
            db.commit()

            update_new_transactions(file_id['id'])

            #print('Upload successful')

            transaction_count = db.execute(
                'SELECT COUNT(*) FROM transactions WHERE file_id = ?', (file_id['id'],)
            ).fetchone()

            flash('File uploaded and processed successfully. {} transactions added.'.format(transaction_count[0]))
            
            return jsonify({'message': '{} transactions added.'.format(transaction_count[0])}), 200

        else:
            #print('unsuccessful')
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (g.user['id'], 'FILE UPLOAD', '{} has NOT been uploaded'.format(file.filename))
            )
            db.commit()

            return jsonify({'error': 'Upload Error.'}), 400

    
    return render_template('fileman/upload.html', card_provider_set=card_provider_set)


# Function to check if file is allowed as set in ALLOWED_EXTENSIONS
def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Function for pdfparser
def pdfparse(file, file_id, date_format, year):
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            transaction_pattern = DATE_PATTERN[date_format][0]
            transactions = []
            transaction_number = 0
            for row in text.split('\n'):
                if re.match(transaction_pattern, row):
                    transaction_details = row.split()
                    transactions.append(transaction_number)
                    
                    transaction_dict = {}

                    # Modify so that date format changes with user input
                    # Change date to datetime format dd/mm/yyyy
                    try:
                        date = datetime.strptime(transaction_details[0], DATE_PATTERN[date_format][1])
                        date = date.replace(year=int(year))
                        transaction_date = date.strftime('%Y-%m-%d')

                        transaction_dict['transaction_date'] = transaction_date
                    except ValueError:
                        transaction_details[0] = transaction_details[0][:2]
                        transaction_details[1] = transaction_details[1][:3]
                        transaction_details[:2] = ['_'.join(transaction_details[:2])]
                        try:
                            date = datetime.strptime(transaction_details[0], DATE_PATTERN[date_format][1])
                            date = date.replace(year=int(year))
                            transaction_date = date.strftime('%Y-%m-%d')
                            transaction_dict['transaction_date'] = transaction_date
                            transaction_details[:4] = ['_'.join(transaction_details[:4])]
                        except ValueError:
                            pass
                    



                    # Change amount data to float
                    elements = len(transaction_details)
                    try:
                        amount = float(transaction_details[elements - 1].replace(',', '').replace('CR', ''))

                    # Remove elements that do not belong to transaction description
                        transaction_details.remove(transaction_details[elements - 1])
                        transaction_details.remove(transaction_details[0])
                        transaction_details.remove(transaction_details[0])

                    # Combine elements for transaction info
                        transaction_info = ' '.join(transaction_details)
                        transaction_dict['transaction_info'] = re.sub(r'[^a-zA-Z0-9\s]', '', transaction_info)
                    
                        # Check if this is a payment
                        for i in range(len(PAYMENT_PHRASE)):
                            if re.match(PAYMENT_PHRASE[i], transaction_info, re.IGNORECASE):
                                amount = -1 * amount
                                break
                        transaction_dict['transaction_amount'] = amount
                    
                        db = get_db()                            

                        db.execute(
                            'INSERT INTO transactions (file_id, transaction_date, transaction_info, transaction_amount, sub_account_item_id)'
                            ' VALUES (?, ?, ?, ?, ?)', (file_id, transaction_dict['transaction_date'], 
                            transaction_dict['transaction_info'], transaction_dict['transaction_amount'], 1) #1 for blank sub_account_item_id
                        )
                        db.commit()

                        transaction_number += 1
                 
                    except ValueError:
                        pass         
    return


# Function to update item_types of new transactions
def update_new_transactions(file_id):
    # Check if user has keywords from previous uploads/sorts
    db = get_db()
    keywords = db.execute(
        'SELECT * FROM user_sort WHERE user_id = ?', (g.user['id'],)
    ).fetchall()
    
    keyword_list = [row['keyword'] for row in keywords]

    if keyword_list:
        for keyword in keyword_list:
            # Iterate over the keywords
            transactions = db.execute(
                'SELECT users.id, files.id AS file_id, transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount '
                ' FROM transactions JOIN files ON transactions.file_id = files.id '
                ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
                ' JOIN users ON log_sessions.user_id = users.id'
                ' WHERE users.id = ? AND file_id = ?'
                ' AND transaction_info LIKE ?'
                ' ORDER BY transaction_date DESC', (g.user['id'], file_id, '%' + keyword + '%')
            ).fetchall()

            item_type_select = db.execute(
                'SELECT * FROM sub_account_items JOIN user_sort ON user_sort.item_type_id = sub_account_items.id'
                ' WHERE user_id = ? AND keyword = ?', (g.user['id'], keyword)
            ).fetchone()

            for row in transactions:
                db.execute(
                    'UPDATE transactions SET sub_account_item_id = ?'
                    ' WHERE id = ?', (item_type_select['id'], row['transaction_id'])
                )
                db.commit()

            # Insert into user logs
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (g.user['id'], 'TRANSACTION UPDATE', 'Group update with keyword: {} to {}'.format(keyword, item_type_select['item_type']))
            )
            db.commit()
    
