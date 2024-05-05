-- Insert test data into the users table
INSERT INTO users (username, password, email, contact_number, last_name, first_name, birth_date, gender, civil_status, nationality, residence, occupation, consent, join_date, admin_rights)
VALUES 
('test', 'pbkdf2:sha256:50000$TCI4GzcX$0de171a4f4dac32e3364c7ddc7c14f3e2fa61f2d17574483f7ffbb431b4acb2f', 'user3@example.com', 1234567890, 'Doe', 'John', '1990-01-01', 'Male', 'Single', 'American', 'New York', 'Software Engineer', 'Yes', '2024-04-28', 'No'),
('user1', 'pbkdf2:sha256:50000$TCI4GzcX$0de171a4f4dac32e3364c7ddc7c14f3e2fa61f2d17574483f7ffbb431b4acb2f', 'user1@example.com', 1234567890, 'Doe', 'John', '1990-01-01', 'Male', 'Single', 'American', 'New York', 'Software Engineer', 'Yes', '2024-04-28', 'No'),
('user2', 'pbkdf2:sha256:50000$TCI4GzcX$0de171a4f4dac32e3364c7ddc7c14f3e2fa61f2d17574483f7ffbb431b4acb2f', 'user2@example.com', 9876543210, 'Smith', 'Jane', '1985-05-15', 'Female', 'Married', 'British', 'London', 'Teacher', 'Yes', '2024-04-28', 'No');

-- Insert test data into the log_sessions table
INSERT INTO log_sessions (user_id, login_timestamp, logout_timestamp)
VALUES
(1, '2024-04-28 08:00:00', '2024-04-28 17:00:00'),
(2, '2024-04-28 09:30:00', '2024-04-28 18:30:00');

-- Insert test data into the files table
INSERT INTO files (filename, log_session_id, card_provider, card_type)
VALUES
('file1.csv', 1, 'Visa', 'Credit'),
('file2.csv', 2, 'Mastercard', 'Debit');

-- Insert test data into the transactions table
INSERT INTO transactions (file_id, transaction_date, transaction_info, transaction_amount, sub_account_item_id, publish)
VALUES
(1, '2024-04-28', 'Purchase at grocery store', 50.00, NULL, 'Yes'),
(2, '2024-04-28', 'Online payment', 100.00, NULL, 'Yes');

-- Insert test data into the sub_account_items table
INSERT INTO sub_account_items (item_type, sub_account_type, balance_sheet_account_type, source)
VALUES
('Expense', 'Groceries', 'Operating Expenses', 1),
('Income', 'Salary', 'Revenue', 2);

-- Insert test data into the user_sort table
INSERT INTO user_sort (user_id, keyword, item_type_id)
VALUES
(1, 'Groceries', 1),
(2, 'Salary', 2);

-- Insert test data into the logs table
INSERT INTO logs (user_id, action_type, action_to, log_datetime)
VALUES
(1, 'Login', 'System', '2024-04-28 08:00:00'),
(2, 'Login', 'System', '2024-04-28 09:30:00');
