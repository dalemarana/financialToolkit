import sqlite3

import csv
import click
from flask import current_app, g


csv_file_path = "/static/account_types.csv"


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row

    return g.db


def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()


def init_db():
    db = get_db()

    with current_app.open_resource('schema.sql') as f:
        db.executescript(f.read().decode('utf8'))

    
        # Open the CSV file and insert data into the database
    with open(current_app.root_path + csv_file_path, 'r') as csv_file:
        csv_reader = csv.reader(csv_file)
        next(csv_reader)  # Skip the header row if it exists

        for row in csv_reader:
            # Assuming your CSV has columns in the order of your database table columns
            # Adjust the column indices as needed
            column1, column2, column3 = row  # Change to match your CSV structure

            # Insert data into your database table
            db.execute(
                'INSERT INTO sub_account_items (item_type, sub_account_type, balance_sheet_account_type, source) VALUES (?, ?, ?, ?)',
                (column1, column2, column3, 0)
            )
        
        # Commit the changes to the database
        db.commit()
        

@click.command('init-db')
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    click.echo('Initialized the database')


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)