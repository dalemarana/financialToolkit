import functools
import csv

from flask import(
    Blueprint, flash, g, jsonify, redirect, render_template, request, session, url_for, current_app
)
from werkzeug.security import check_password_hash, generate_password_hash

from finassist_f.db import get_db
from datetime import datetime

# Static files for list of occupations, countries, nationality, 
#   and gender to be used in registration dropdowns
civil_file = "/static/registration_lists/civil_status.txt"
countries_file = "/static/registration_lists/countries.txt"
gender_file = "/static/registration_lists/gender.txt"
nationality_file = "/static/registration_lists/nationality.txt"
occupations_file = "/static/registration_lists/occupations.txt"

bp = Blueprint('auth', __name__, url_prefix='/auth')


## ENDPOINT - Registration page
@bp.route('/register', methods=('GET', 'POST'))
def register():

    # Initialize the lists for registration form to be used for Jinja
    civil_status, countries, gender, nationality, occupations = reg_list()
        
    if request.method == 'POST':

         # Get the data from HTML form
        username = request.form['username']
        password = request.form['password']
        confirmation = request.form['confirmation']
        email = request.form['email']
        contact_number = request.form['contact_number']
        last_name = request.form['last_name']
        first_name = request.form['first_name']
        birth_date = request.form['birth_date']
        gender = request.form['gender']
        nationality = request.form['nationality']
        residence = request.form['residence']
        occupation = request.form['occupation']
        consent = request.form['consent']

        db = get_db()
        error = None


        # The error message is updated to catch various scenarios, 
        # including missing fields, password mismatch, and existing username/email.
        # Server check for required fields
        if not all([username, password, confirmation, email, last_name, first_name, birth_date, gender, consent]):
            error = 'All fields are required.'
        # Check if password and confirmation match
        elif confirmation != password:
            error = 'Passwords do not match.'
        else:
            # A single SQL query checks if the username or email already exists in the database.
            # Check if username or email already exists
            existing_user = db.execute(
                "SELECT id FROM users WHERE username = ? OR email = ?", (username, email)
            ).fetchone()
            if existing_user:
                error = 'Username or email address is already registered.'
        
        # The registration process is wrapped in a try-except block to handle database integrity errors gracefully.
        if error is None:
            try:
                db.execute(
                    "INSERT INTO users (username, password, email, contact_number, last_name, first_name, birth_date, gender, nationality, residence, occupation, consent)"
                    " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (username, generate_password_hash(password), email, contact_number,
                                                                     last_name, first_name, birth_date, gender, nationality, residence, occupation, consent)
                )
                db.commit()
                flash('Registration Successful. Please login.')
                # Insert into user logs
                user_id = db.execute(
                    'SELECT id FROM users WHERE username = ?', (username,)
                ).fetchone()
                db.execute(
                    'INSERT INTO logs (user_id, action_type, action_to)'
                    ' VALUES (?, ?, ?)', (user_id['id'], 'REGISTRATION', '{} registered successfully'.format(username))
                )
                db.commit()

                return redirect(url_for("auth.login"))
            except db.IntegrityError:
                error = "Failed to register. Please contact admin."
        
        
        flash(error)
    
    return render_template('auth/register.html', civil_status=civil_status, countries=countries, gender=gender, nationality=nationality, occupations=occupations)
    


## ENDPOINT - Login Page
@bp.route('/login', methods=('GET', 'POST'))
def login():
    if request.method == 'POST':
        
        username = request.form['username']
        password = request.form['password']
        db = get_db()
        error = None

        # Check if username is registered
        user = db.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()

        if user is None:
            error = 'Incorrect username or password.'
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (username, 'LOGIN', '{} login failed. error: {}'.format(username, error))
            )
            db.commit()
        elif not check_password_hash(user['password'], password):
            error = 'Incorrect username or password.'
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (user['id'], 'LOGIN', '{} login failed. error: {}'.format(user['username'], error))
            )
            db.commit()


        if error is None:
            session.clear()
            session['user_id'] = user['id']
            session['first_name'] = user['first_name']
            
            # INSERT log_session entry
            db.execute(
                "INSERT INTO log_sessions (user_id) VALUES (?)", (user['id'],)
            )
            db.commit()

            # INSERT into user logs
            db.execute(
                'INSERT INTO logs (user_id, action_type, action_to)'
                ' VALUES (?, ?, ?)', (user['id'], 'LOGIN', '{} logged in successfully.'.format(user['username']))
            )
            db.commit()
        
            return redirect(url_for('index'))

        flash(error)
    
    return render_template('auth/login.html')


# This runs before the view function (login()) returns
@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('user_id')

    if user_id is None:
        g.user = None
    else:
        g.user = get_db().execute(
            'SELECT *, log_sessions.id as log_session_id FROM users'
            ' JOIN log_sessions ON users.id = log_sessions.user_id'
            ' WHERE users.id = ? ORDER BY login_timestamp DESC', (user_id,)
        ).fetchone()


# Log out function
@bp.route('/logout')
def logout():
    db = get_db()
    # session_id = db.execute(
    #     'SELECT log_sessions.id AS log_session_id FROM users JOIN log_sessions'
    #     ' ON users.id = log_sessions.user_id WHERE users.id = ? ORDER BY login_timestamp DESC',
    #     (g.user['id'],)
    # ).fetchone()

    # Update into log_sessions
    db.execute(
        'UPDATE log_sessions SET logout_timestamp = ? WHERE id = ?',
        (datetime.now(), g.user['log_session_id'])
    )
    db.commit

    db.execute(
        'INSERT INTO logs (user_id, action_type, action_to)'
        ' VALUES (?, ?, ?)', (g.user['id'], 'LOGOUT', '{} successfully logged out.'.format(session['first_name']))
    )
    db.commit()

    session.clear()
    return redirect(url_for('auth.login'))


## MIDDLEWARE - Require authentication in other views
def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('auth.login'))
        
        return view(**kwargs)
    
    return wrapped_view


"""needs to transfer to a separate module (i.e. Data Middleware Module)"""
## MIDDLEWARE - Function to initialize registration form dropdowns
def reg_list():
    # Civil Status
    civil_status = []
    with open(current_app.root_path + civil_file, 'r') as file:
        reader = csv.reader(file)
        for line in reader:
            civil_status.append(line[0])

    # Countries
    countries = []
    with open(current_app.root_path + countries_file, 'r') as file:
        reader = csv.reader(file)
        for line in reader:
            countries.append(line[0])
    
    # Gender
    gender = []
    with open(current_app.root_path + gender_file, 'r') as file:
        reader = csv.reader(file)
        for line in reader:
            gender.append(line[0])

    # Nationality
    nationality = []
    with open(current_app.root_path + nationality_file, 'r') as file:
        reader = csv.reader(file)
        for line in reader:
            nationality.append(line[0])

    # Profession
    occupations = []
    with open(current_app.root_path + occupations_file, 'r') as file:
        reader = csv.reader(file)
        for line in reader:
            occupations.append(line[0])
            
    
    return civil_status, countries, gender, nationality, occupations