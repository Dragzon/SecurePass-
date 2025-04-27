from flask import Flask, request, render_template, redirect, url_for, jsonify, session
from flask_cors import CORS
from flask_mail import Mail, Message
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask_session import Session

app = Flask(__name__, static_folder='scripts')
app.config['SECRET_KEY'] = 'dc41ff5e3d3e2320073f2a4630ef40f46fbcfba4136c1fb4eda12ee1861d2921'  # Replace with a secure random key
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
CORS(app)

# Flask-Mail configuration (using Gmail as an example)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'dragzonhero@gmail.com'  # Replace with your email
app.config['MAIL_PASSWORD'] = 'zvomauprhkskkhgu'  # Replace with your app-specific password
app.config['MAIL_DEFAULT_SENDER'] = 'dragzonhero@gmail.com'  # Default sender
mail = Mail(app)

# MySQL connection function
def get_database_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='zenitsu2005',
            database='signup',
            port=3306
        )
        if connection.is_connected():
            print("Connected to MySQL database")
        return connection
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# Function to send email notification
def send_expiry_email(user_email, user_name, status, days_until_expiry=None):
    try:
        if status == 'expired':
            subject = 'SecurePass+ - Password Expired'
            body = f"""
            Hi {user_name},

            Your password has expired! For security reasons, please update your password as soon as possible.
            Visit the analyzer page to update it: http://127.0.0.1:5000/analyze

            Best,
            The SecurePass+ Team
            """
        elif status == 'warning':
            subject = 'SecurePass+ - Password Expiry Warning'
            body = f"""
            Hi {user_name},

            Your password will expire in {days_until_expiry} days. To maintain security, please update your password soon.
            Visit the analyzer page to update it: http://127.0.0.1:5000/analyze

            Best,
            The SecurePass+ Team
            """
        else:
            return  # No email for 'valid' status

        msg = Message(subject=subject, recipients=[user_email], body=body)
        mail.send(msg)
        print(f"Email sent to {user_email} for {status} status.")
    except Exception as e:
        print(f"Error sending email to {user_email}: {e}")

# Routes
# Register user
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        # Parse JSON payload from frontend
        data = request.get_json()
        firstname = data.get('firstname')
        email = data.get('email')
        password = data.get('password')

        if not firstname or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400

        connection = get_database_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            connection.close()
            return jsonify({'error': 'User already exists'}), 400

        hashed_password = generate_password_hash(password)
        created_at = datetime.utcnow()
        cursor.execute("INSERT INTO users (first_name, email, password, created_at) VALUES (%s, %s, %s, %s)", 
                       (firstname, email, hashed_password, created_at))
        connection.commit()
        print(f"User {firstname} inserted into the database.")
        connection.close()
        
        return jsonify({'success': True, 'message': 'Account created successfully'}), 200

    return render_template('signup.html')

# Login user
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Parse JSON payload from frontend
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        connection = get_database_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            connection.close()
            return jsonify({'error': 'Invalid email or password'}), 401

        if not check_password_hash(user['password'], password):
            connection.close()
            return jsonify({'error': 'Invalid email or password'}), 401

        session['user_id'] = user['email']
        session['first_name'] = user['first_name']
        print("Login successful for user:", user['email'])
        connection.close()

        return jsonify({'success': True, 'message': 'Login successful'}), 200

    return render_template('login.html')

# Home page route
@app.route('/home')
def home():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('home.html', user={'first_name': session['first_name'], 'email': session['user_id']})

# Analyze page route
@app.route('/analyze', methods=['GET', 'POST'])
def analyze():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('project.html', user={'email': session['user_id']})

# Endpoint to check password expiry
@app.route('/api/check_expiry', methods=['GET'])
def check_expiry():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    connection = get_database_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT created_at, first_name, email FROM users WHERE email = %s", (user_id,))
    user = cursor.fetchone()

    if not user:
        connection.close()
        return jsonify({'error': 'User not found'}), 404

    created_at = user['created_at']
    expiry_date = created_at + timedelta(minutes=5)  # Password expires after 5 minutes
    warning_date = expiry_date - timedelta(minutes=2)  # Warn 2 minutes before expiry
    now = datetime.utcnow()

    # Prepare response
    if now >= expiry_date:
        status = 'expired'
        message = 'Your password has expired! Please reset it.'
        days_since_creation = (now - created_at).days
        minutes_since_creation = (now - created_at).total_seconds() / 60
        # Send expiry email
        send_expiry_email(user['email'], user['first_name'], 'expired')
    elif now >= warning_date:
        status = 'warning'
        minutes_until_expiry = (expiry_date - now).total_seconds() / 60  # Use minutes since expiry is in minutes
        message = f'Your password will expire in {int(minutes_until_expiry)} minutes.'
        days_since_creation = (now - created_at).days
        minutes_since_creation = (now - created_at).total_seconds() / 60
        # Send warning email
        send_expiry_email(user['email'], user['first_name'], 'warning', int(minutes_until_expiry))
    else:
        status = 'valid'
        message = 'Your password is still valid.'
        days_since_creation = (now - created_at).days
        minutes_since_creation = (now - created_at).total_seconds() / 60

    connection.close()
    return jsonify({
        'status': status,
        'message': message,
        'days_since_creation': days_since_creation,
        'minutes_since_creation': int(minutes_since_creation)
    })

# Endpoint to reset password
@app.route('/api/reset_password', methods=['POST'])
def reset_password():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    new_password = data.get('new_password')
    user_id = session['user_id']

    if not new_password:
        return jsonify({'error': 'New password required'}), 400

    connection = get_database_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = connection.cursor()
    hashed_password = generate_password_hash(new_password)
    query = """
        UPDATE users SET password = %s, created_at = %s WHERE email = %s
    """
    cursor.execute(query, (hashed_password, datetime.utcnow(), user_id))
    connection.commit()
    connection.close()

    return jsonify({'message': 'Password reset successfully'}), 200

# Logout route
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# Run the server
if __name__ == '__main__':
    app.run(debug=True, port=5000)