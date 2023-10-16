DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS log_sessions;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS sub_account_items;
DROP TABLE IF EXISTS user_sort;
DROP TABLE IF EXISTS logs;


CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    contact_number INTEGER NOT NULL,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    birth_date DATE, 
    gender TEXT,
    civil_status TEXT,
    nationality TEXT,
    residence TEXT, 
    occupation TEXT,
    consent TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    admin_rights TEXT
);

CREATE TABLE log_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    login_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_timestamp DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    log_session_id INTEGER NOT NULL,
    card_provider TEXT NOT NULL,
    card_type TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (log_session_id) REFERENCES log_sessions (id)
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_info TEXT NOT NULL,
    transaction_amount REAL NOT NULL,
    sub_account_item_id INTEGER,
    publish TEXT,
    FOREIGN KEY (file_id) REFERENCES files (id),
    FOREIGN KEY (sub_account_item_id) REFERENCES sub_account_items (id)
);

CREATE TABLE sub_account_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    sub_account_type TEXT NOT NULL,
    balance_sheet_account_type TEXT NOT NULL
);

CREATE TABLE user_sort (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    item_type_id TEXT NOT NULL,
    entry_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (item_type_id) REFERENCES sub_account_items (id)
);

CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    action_to TEXT NOT NULL,
    log_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
    