import os
    
from flask import (
    Blueprint, flash, g, redirect, request, render_template, request, url_for, jsonify, current_app
)
from flask_cors import CORS
from werkzeug.exceptions import abort
from jinja2 import Environment
from datetime import datetime

from finassist_f.auth import login_required
from finassist_f.db import get_db

# To be modified to become dynamic
TABLE_HEADERS = ['transaction_date', 'transaction_info', 'item_type', 'sub_account_type', 'card_provider', 'transaction_amount']

# Credit Positive List
CREDIT_POSITIVE = ['equity', 'liabilities', 'revenue']

# Allowed upload extensions
ALLOWED_EXTENSIONS = {'pdf'}

env = Environment()
env.globals.update(zip=zip)

bp = Blueprint('dataman', __name__)

CORS(bp)


@bp.route('/')
@login_required
def index():
    db = get_db()
    #print('index called')

    # Retrieve uploaded transactions by the user
    transactions = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' AND publish = ?'    
        ' ORDER BY transaction_date DESC'
        , (g.user['id'], 'published')
    ).fetchall()

    all_types = db.execute(
        'SELECT item_type FROM sub_account_items WHERE source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE source = ?', (g.user['id'],)
    ).fetchall()
    all_item_types = []
    for row in all_types:
        all_item_types.append(row[0])

    #print(all_item_types)
    if transactions is None:
        flash('NO UPLOADED TRANSACTIONS')
        return render_template('dataman/index.html')
        
    print('ok')
    return render_template('dataman/index.html', transactions=transactions, table_headers=TABLE_HEADERS, all_item_types=all_item_types)



# Endpoint to get the data for the dashboard charting
# This will run in the background after server side render ('/') is sent to
# the client
@bp.route('/get_data')
@login_required
def get_data():
    db = get_db()

    # Retrieve all data for client-side rendering
    data = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' AND publish = ?'    
        ' ORDER BY transaction_date DESC'
        , (g.user['id'], 'published')
    ).fetchall()

    # Convert to list of Dictionaries (JSON)
    data_list = []
    for row in data:
        data_list.append(dict(row))
    
    #print(data_list)
    return jsonify(data_list)



@bp.route('/update', methods=('GET', 'POST'))
@login_required
def update():

    db = get_db()
    # Retrieve uploaded transactions by the user. Filter blank item_types in transactions
    transactions = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'        
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' AND transaction_amount > 0'
        ' AND publish is NULL'
        ' ORDER BY transaction_date DESC', (g.user['id'], )
    ).fetchall()

    all_card_providers = db.execute(
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

    all_card_provider_options = set([row['card_provider'] for row in all_card_providers])

    #print(transactions)
    transaction_id_list = [row['transaction_id'] for row in transactions]

    card_provider_set = set([row['card_provider'] for row in transactions])
    card_type_set = set([row['card_type'] for row in transactions])
    #print(card_provider_set)

    #Retrieve the payments made to this credit card
    payments = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'        
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' AND transaction_amount < 0'
        ' AND publish is NULL'
        ' ORDER BY transaction_date DESC', (g.user['id'], )    
    ).fetchall()
    
    payments_id_list = [row['transaction_id'] for row in payments]


    card_provider = next(iter(card_provider_set))
    card_type = (next(iter(card_type_set))).replace('_', ' ')

    #print('{} {}'.format(card_provider, card_type))
    # Retrieve the item_type of the card_provider
    card_provider_item_type = db.execute(
        'SELECT * FROM sub_account_items WHERE item_type LIKE ? AND source = ?',
        ('{} {} %'.format(card_provider, card_type), g.user['id'])
    ).fetchone()

    # This is to provide credit card accounts or debit card accounts
    payment_options = db.execute(
        'SELECT * FROM sub_account_items WHERE sub_account_type = "cash" AND source = 0'
        ' UNION SELECT * FROM sub_account_items WHERE sub_account_type = "account_payables" AND source = 0'
        ' UNION SELECT * FROM sub_account_items WHERE sub_account_type = "cash" AND source = ?'
        ' UNION SELECT * FROM sub_account_items WHERE sub_account_type = "account_payables" AND source = ?',
        (g.user['id'], g.user['id'])
    ).fetchall()

    payment_options_list = [row['item_type'] for row in payment_options]
    #print(card_provider_item_type['id'])

    # Tag all payments to deduct amount paid to payables
    for payment_id in payments_id_list:
        try:
            db.execute(
                'UPDATE transactions SET sub_account_item_id = ?'
                ' WHERE id = ?', (card_provider_item_type['id'], payment_id)
            )
            db.commit()
            
            # Insert into user logs
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (g.user['id'], 'UPDATE PAYMENT', 'transaction {} added as payable type'.format(payment_id))
            )
            db.commit()
        except TypeError:
            pass


    # This is used to list the item types in HTML select tag, this is only applicable for credit cards
    types = db.execute(
        'SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "expense" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "asset" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "liabilities" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "expense" AND source = ?'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "asset" AND source = ?'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "liabilities" AND source = ?', 
        (g.user['id'], g.user['id'], g.user['id'])
    ).fetchall()
    item_types = []
    for row in types:
        item_types.append(row[0])

    # same from above but includes all item types
    all_types = db.execute(
        'SELECT item_type FROM sub_account_items WHERE source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE source = ?', (g.user['id'],)
    ).fetchall()
    all_item_types = []
    for row in all_types:
        all_item_types.append(row[0])


    if request.method == 'POST':
        try:
            keyword = request.form.get('vendor_info')
            item_type = request.form.get('item_type')
            error = None

            if keyword is None:
                error = 'No keyword input.'
            elif item_type is None:
                error = 'No selected item type.'
            
            if error is None:
                response_data = {'message': 'Data processed successfully'}
                
                # Update db based on user response
                db = get_db()
                #print(item_type)
                item_type_select = db.execute(
                    'SELECT * FROM sub_account_items WHERE item_type = ?',(item_type,)
                ).fetchone()

                # Insert user keyword to user_sort table
                db.execute(
                    'INSERT INTO user_sort (user_id, keyword, item_type_id)'
                    ' VALUES (?, ?, ?)', (g.user['id'], keyword, item_type_select['id'])
                )
                db.commit()

                # Insert into user logs
                db.execute(
                    'INSERT INTO logs (user_id, action_type, action_to)'
                    ' VALUES (?, ?, ?)', (g.user['id'], 'NEW KEYWORD', '{} added as {} type'.format(keyword, item_type_select['item_type']))
                )
                db.commit()

                # Update database based on new keyword. Make sure to only update the transactions with blanks
                transactions = db.execute(
                    'SELECT files.id AS file_id, filename, card_provider, card_type, '
                    ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
                    ' item_type, sub_account_type, balance_sheet_account_type'        
                    ' FROM transactions JOIN files ON transactions.file_id = files.id '
                    ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
                    ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
                    ' JOIN users ON log_sessions.user_id = users.id'
                    ' WHERE users.id = ? AND transactions.sub_account_item_id = ?'
                    ' AND transaction_info LIKE ?'
                    ' ORDER BY transaction_date DESC', (g.user['id'], 1, '%' + keyword + '%')
                ).fetchall()

                for row in transactions:

                     # Check if item_type_select['balance_sheet_account_type'] is Revenue or Asset
                    if item_type_select['balance_sheet_account_type'] in CREDIT_POSITIVE:
                        print('asset')
                        db.execute(
                            'UPDATE transactions SET sub_account_item_id = ?, transaction_amount = ?'
                            ' WHERE id = ?', (item_type_select['id'], -1 * row['transaction_amount'], row['transaction_id'])
                        )
                        db.commit()                    
                    else:
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
            
                flash('Transactions successfully updated.')
                print(response_data)
                return jsonify(response_data)
            
            flash(error)
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return render_template('dataman/update.html', transactions=transactions, 
                table_headers=TABLE_HEADERS, item_types=item_types, card_provider_set=all_card_provider_options, 
                payments=payments, all_item_types=all_item_types, payment_options_list=payment_options_list)


@bp.route('/search')
def search():
    q = request.args.get('q')
    print(q)
    db = get_db()
    if q:
        try:
            vendors = db.execute(
                'SELECT DISTINCT files.id AS file_id, filename, card_provider, card_type, '
                ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
                ' item_type, sub_account_type, balance_sheet_account_type'        
                ' FROM transactions JOIN files ON transactions.file_id = files.id '
                ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
                ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
                ' JOIN users ON log_sessions.user_id = users.id'
                ' WHERE users.id = ?'
                ' AND transaction_info LIKE ?'
                ' ORDER BY transaction_date DESC', (g.user['id'], '%' + q + '%')
            ).fetchall()
        
        except TypeError:
            print('search error')
        
    else:
        vendors = db.execute(
            'SELECT files.id AS file_id, filename, card_provider, card_type, '
            ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
            ' item_type, sub_account_type, balance_sheet_account_type'                    
            ' FROM transactions JOIN files ON transactions.file_id = files.id '
            ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
            ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
            ' JOIN users ON log_sessions.user_id = users.id'
            ' WHERE users.id = ?'
            ' AND transaction_amount > 0'
            ' ORDER BY transaction_date DESC', (g.user['id'],)
        ).fetchall()

    vendor_dict = {vendor['transaction_id']: dict(vendor) for vendor in vendors}
    #print(vendor_dict)
    return jsonify(vendor_dict)


@bp.route('/get_updated_table_data')
def get_updated_table_data():
    # Retrieve the updated table
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

    transactions_id_list = [row['transaction_id'] for row in transactions]

    # This is used to list the items in HTML select tag, 
    types = db.execute(
        'SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "expense" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "asset" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "liabilities" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "expense" AND source = ?'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "asset" AND source = ?'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "liabilities" AND source = ?', 
        (g.user['id'], g.user['id'], g.user['id'])
    ).fetchall()
    item_types = []
    for row in types:
        item_types.append(row[0])
    
    # Render the updated table as HTML
    updated_table_html = render_template('dataman/updated_table.html', transactions=transactions, table_headers=TABLE_HEADERS, item_types=item_types)

    # Render the updated table as HTML within JSON response
    return jsonify({'table_html': updated_table_html})


@bp.route('/delete_transaction', methods=('POST',))
@login_required
def delete_transaction():
    transaction_id = int(request.form.get('transaction_id'))

    db = get_db()

    transaction = db.execute(
        'SELECT * FROM transactions WHERE id = ?', (transaction_id,)
    ).fetchone()

    # Get the details before delete
    transaction_details = '{} - {} - {} - {}'.format(
                                        transaction['id'], 
                                        transaction['transaction_date'], 
                                        transaction['transaction_info'],
                                        transaction['transaction_amount'])
    


    # Implement the Delete logic here
    db.execute(
        'DELETE FROM transactions WHERE id = ?', (transaction_id,)
    )
    db.commit()

    # Get the file id to update the aggregate
    update_current_payable(transaction['file_id'])

    # Insert into user logs
    db.execute(
        'INSERT INTO logs (user_id, action_type, action_to)'
        ' VALUES (?, ?, ?)', (g.user['id'], 'DELETE', transaction_details)
    )
    db.commit()

    # If deletion is successful, return a success message
    # You can include the data in the response as needed
    response = {'success': True, 'data': 'Additional data if needed'}

    return jsonify(response)


@bp.route('/update_main', methods=('POST',))
@login_required
def update_main():
    db = get_db()

    
    # Retrieve uploaded transactions by the user. Filter blank item_types in transactions
    transactions = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'   
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' AND transaction_amount > 0'
        ' ORDER BY transaction_date DESC', (g.user['id'],)
    ).fetchall()

    blank_tx = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'   
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' AND sub_account_items.id = 33'
        ' AND transaction_amount > 0'
        ' ORDER BY transaction_date DESC', (g.user['id'],)
    ).fetchall()
    
    transaction_id_list = [row['transaction_id'] for row in transactions]
    blanks = [row['transaction_id'] for row in blank_tx]

    if request.method == 'POST':
        # Loop to get all the updated transactions
        for id in transaction_id_list:
            item_type = request.form.get(f'transaction_{id}')

            # Modify each transaction based on user input
            item_type_id = db.execute(
                'SELECT * FROM sub_account_items WHERE item_type = ?', (item_type,)
            ).fetchone()
            if item_type_id is not None:
                item_type_id = item_type_id['id']

                db.execute(
                    'UPDATE transactions SET sub_account_item_id = ?'
                    ' WHERE id = ?', (item_type_id, id)
                )
                db.commit()
        
        flash('Transactions has been updated')
    
        response = {'success': True, 'message': 'Data processed successfully', 
        'totalTransactions': len(transaction_id_list), 'withBlanks': len(blanks)}

        return jsonify(response)


@bp.route('/update_transaction', methods=('POST',))
def update_transaction():
    try:
        # Parse JSON data from request
        data = request.get_json()

        # Extract the values
        transaction_amount = float(data.get('transactionAmount'))
        transaction_info = data.get('transactionInfo')
        item_type = data.get('itemType')
        transaction_id = int(data.get('transactionId'))

        # print(transaction_amount)
        # print(item_type)
        # print(transaction_id)


        # Update the database using the user input
        db = get_db()
    
        item_type_id = db.execute(
            'SELECT * FROM sub_account_items WHERE item_type = ?', (item_type,)
        ).fetchone()


        db.execute(
            'UPDATE transactions SET transaction_info = ?, sub_account_item_id = ?, transaction_amount = ?'
            ' WHERE id = ?', (transaction_info, item_type_id['id'], transaction_amount, transaction_id)
        )
        db.commit()
        # Insert into user logs
        db.execute(
            'INSERT INTO logs (user_id, action_type, action_to)'
            ' VALUES (?, ?, ?)', (g.user['id'], 'UPDATE', 'transaction {} updated to {} | {}'.format(transaction_id, transaction_info, item_type))
        )
        db.commit()      
        response = {'success': True, 'message': 'Data received successfully'} 

        flash('Transactions has been updated.')
    
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': 'An error occurred'}), 500

    print(transaction_id)



# For Manual Form Entry
@bp.route('/manual_entry', methods=('POST',))
def manual_entry():
    #print('function called')
    try:
        # Parse JSON from request
        data = request.get_json()
        
        print(data)
        db = get_db()
        
        for transaction in data:
            # Check if card Provider is included in the item_type check the card_provider and card_type
            if transaction['itemType'] == 'default_current_account' or transaction['itemType'] == 'payable':
                card_provider = transaction['cardProvider']
                card_type = transaction['cardType']

                # if existing in item_types. if it is existing, use the appropriate item_type number. If not, make a new item_type
                # based on the card_provider and card_type

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
                        print('not new')
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
                        print('not new')
                        pass
                
                item_type_id = db.execute(
                        'SELECT * FROM sub_account_items WHERE item_type LIKE ?', ('{} {} -user{}'.format(card_provider, card_type.replace('_', ' '), g.user['id']),)
                ).fetchone()

            else:
                item_type_id = db.execute(
                    'SELECT * FROM sub_account_items WHERE item_type = ?', (transaction['itemType'],)
                ).fetchone()


            print(item_type_id['id'])

            db.execute(
                'INSERT INTO files '
                ' (filename, log_session_id, card_provider, card_type)'
                ' VALUES (?, ?, ?, ?)', ('manual_entry', g.user['log_session_id'], transaction['cardProvider'],
                transaction['cardType'])
            )
            db.commit()

            file_id = db.execute(
                'SELECT * FROM files WHERE log_session_id = ? AND filename = ?'
                ' ORDER BY id DESC', (g.user['log_session_id'], 'manual_entry')
            ).fetchone()
            print(transaction['itemType'])

            # payments should incur negative in cash/asset transactions. Check what type of 
            # Balance sheet account type is the transaction
            balance_sheet_account_type = db.execute(
                'SELECT balance_sheet_account_type FROM sub_account_items WHERE id = ?', (item_type_id['id'],)
            ).fetchone()
            print(balance_sheet_account_type[0])
            transaction_amount = float(transaction['transactionAmount'])

            if balance_sheet_account_type[0] == 'asset':  # This is hard coded.
                print('ok')
                transaction_amount = -1 * transaction_amount

            db.execute(
                'INSERT INTO transactions (file_id, transaction_date, transaction_info, transaction_amount, sub_account_item_id)'
                ' VALUES (?, ?, ?, ?, ?)', (file_id['id'], transaction['transactionDate'], transaction['transactionInfo'], 
                transaction_amount, item_type_id['id'])
            )
            db.commit()

            # call add_double_entry function. To add an equivalent balance_sheet_account_type
            # add_double_entry(transaction['transactionDate'], transaction['transactionInfo'], item_type_id['id'], transaction_amount)

            # Insert into user logs
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (g.user['id'], 'MANUAL ENTRY', '{} | {} | {} | {} | {} | {}'.format(transaction['transactionDate'], 
                transaction['transactionInfo'],  transaction['itemType'], transaction['cardProvider'],
                transaction['cardType'], transaction['transactionAmount']))
            )
            db.commit()   

        flash('Transactions has been added.')

        # add_more_html = render_template('dataman/add_more.html', transactions=transactions, table_headers=TABLE_HEADERS, item_types=item_types)

        response = {'success': True, 'message': 'Data processed successfully'} 
        return jsonify(response), 200


    except Exception as e:
        return jsonify({'error': 'An error occured'}), 500    


# Function to Publish the updated transactions
@bp.route('/publish', methods=('POST',))
def publish():
    #print('publish function called')

    db = get_db()
    # Retrieve uploaded transactions by the user. Filter blank item_types in transactions
    transactions = db.execute(
        'SELECT files.id AS file_id, filename, card_provider, card_type, '
        ' transactions.id AS transaction_id, transaction_date, transaction_info, transaction_amount, publish,'
        ' item_type, sub_account_type, balance_sheet_account_type'   
        ' FROM transactions JOIN files ON transactions.file_id = files.id '
        ' JOIN sub_account_items ON transactions.sub_account_item_id = sub_account_items.id'
        ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
        ' JOIN users ON log_sessions.user_id = users.id'
        ' WHERE users.id = ?'
        ' AND publish is NULL'
        ' ORDER BY transaction_date DESC', (g.user['id'], )
    ).fetchall()

    publish = []
        
    for transaction in transactions:
        transaction_dict = {
            'transaction_date': transaction['transaction_date'],
            'transaction_info': transaction['transaction_info'],
            'item_type': transaction['item_type'],
            'card_provider': transaction['card_provider'],
            'card_type': transaction['card_type'],
            'transaction_amount': transaction['transaction_amount']
        }
        publish.append(transaction_dict)

    
    # This is to be applied during an Uploaded file 
    # Retrieve the file_id and details of the uploaded file
        
    try:
        current_payable_file_name = ((list(set([row['filename'] for row in transactions]))).remove('manual_entry'))[0]
    except (ValueError, TypeError):
        current_payable_file_name = ((list(set([row['filename'] for row in transactions]))))[0]


    # print(list(set([row['filename'] for row in transactions])))
    
    print(current_payable_file_name)

    if not current_payable_file_name == 'manual_entry':
    # Retrieve file id based on name
        print('ok')
        current_payable_file_id = db.execute(
            'SELECT files.id FROM files '
            ' JOIN log_sessions ON files.log_session_id = log_sessions.id'
            ' JOIN users ON log_sessions.user_id = users.id'
            ' WHERE filename = ? AND users.id = ?', (current_payable_file_name, g.user['id'])
        ).fetchone()[0]

        add_current_payable(current_payable_file_id)
    else:
        pass

    #print(publish)
    transaction_id_list = [row['transaction_id'] for row in transactions]

    try:
        # Tag transactions as published
        for transaction_id in transaction_id_list:
            db.execute(
                'UPDATE transactions SET publish = ? WHERE id = ?',
                ('published', transaction_id)
            )
            db.commit()

        #print('ok')
        flash('Transactions has been published.')

        status = {'success': True, 'message': 'Action requested successfully'} 
        response = [status, publish]
        return jsonify(response), 200


    except Exception as e:
        return jsonify({'error': 'An error occured'}), 500    


# Function to add a payable account (credit_card) and add provide a total payable 
# based on the uploaded file
def add_current_payable(file_id):
    db = get_db()

    # Get last date from the file_id
    date = db.execute(
        'SELECT transaction_date FROM transactions WHERE file_id = ? ORDER BY transaction_date DESC',
        (file_id,)
    ).fetchone()[0]

    file_to_update = db.execute(
        'SELECT * FROM files WHERE id = ?', (file_id,)
    ).fetchone()

    # Retrieve sub_account_id of the card_provider
    card_provider_item_type = db.execute(
        'SELECT * FROM sub_account_items WHERE item_type LIKE ? AND source = ?',
        ('{} {} %'.format(file_to_update['card_provider'], file_to_update['card_type']), g.user['id'])
    ).fetchone()

    # Retrieve Total debit to the card_provider from file_id
    total_payable = db.execute(
        'SELECT SUM(transaction_amount) FROM transactions WHERE transaction_amount > 0'
        ' AND file_id = ?', (file_id,)
    ).fetchone()[0]

    # date = file_to_update['upload_date']
    # formatted_date = (datetime.strptime(date, '%Y-%m-%d %H:%M:%S')).strftime('%Y-%m-%d')
    print(file_id)
    print(total_payable)
    # Insert Into transactions
    db.execute(
        'INSERT INTO transactions (file_id, transaction_date, transaction_info, transaction_amount, sub_account_item_id, publish)'
        ' VALUES (?, ?, ?, ?, ?, ?)', (file_id, date, 
                                 'Aggregate PAYABLE to {} {}'.format(file_to_update['card_provider'], file_to_update['card_type'].replace('_', ' ')),
                                 total_payable ,card_provider_item_type['id'], 'published')
    )
    db.commit()


# Function to update existing payable account (credit card) - Liability
def update_current_payable(file_id):
    db = get_db()

    # Get Aggregate transaction details
    transaction_to_update = db.execute(
        'SELECT * FROM transactions WHERE transaction_info LIKE ? AND file_id = ?', ('Aggregate PAYABLE to%' ,file_id)
    ).fetchone()
    if transaction_to_update is not None:
        # Get Updated value except
        total_payable = db.execute(
            'SELECT SUM(transaction_amount) FROM transactions WHERE transaction_amount > 0'
            ' AND file_id = ?', (file_id,)
        ).fetchone()[0]

        total_payable = total_payable - transaction_to_update['transaction_amount']

        # Update the Aggregate payable
        db.execute(
            'UPDATE transactions SET transaction_amount = ? WHERE id = ?', (total_payable, transaction_to_update['id'])
        )
        db.commit()
    
    else:
        print('nothing to update')
        pass



# Function to add transactions manually (main)
@bp.route('/add', methods=('GET', 'POST'))
def add():
    db = get_db()
    # Retrieve uploaded transactions by the user. Filter blank item_types in transactions
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

   
    transaction_id_list = [row['transaction_id'] for row in transactions]

    card_provider_set = set([row['card_provider'] for row in transactions])

    # This is used to list the item types in HTML select tag, this is only applicable for credit cards
    types = db.execute(
        'SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "expense" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "asset" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "liabilities" AND source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "expense" AND source = ?'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "asset" AND source = ?'
        ' UNION SELECT item_type FROM sub_account_items WHERE balance_sheet_account_type = "liabilities" AND source = ?', 
        (g.user['id'], g.user['id'], g.user['id'])
    ).fetchall()
    item_types = []
    for row in types:
        item_types.append(row[0])

    # same from above but includes all item types
    all_types = db.execute(
        'SELECT item_type FROM sub_account_items WHERE source = 0'
        ' UNION SELECT item_type FROM sub_account_items WHERE source = ?', (g.user['id'],)
    ).fetchall()
    all_item_types = []
    for row in all_types:

        all_item_types.append(row[0])

    if request.method == 'POST':
        manual_entry()

    return render_template('dataman/add.html', transactions=transactions, 
                table_headers=TABLE_HEADERS, item_types=item_types, card_provider_set=card_provider_set, 
                all_item_types=all_item_types )


# Function to add designated balance_sheet_account (asset/libilities) based on revenue/expense transaction
# def add_double_entry(transaction_date, transaction_info, item_type_id, transaction_amount):
    ...
    # Check if debit card transaction card_type

        # Check if expense or revenue transaction, if revenue, (+)  if expense (-) 
