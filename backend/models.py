# backend/models.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.String(100), primary_key=True) # Use Google's unique ID
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    profile_pic = db.Column(db.String(200)) # Store URL from Google
    phone_number = db.Column(db.String(20))
    address = db.Column(db.String(200))
    # Add relationship to transactions if needed
    # transactions = db.relationship('Transaction', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.email}>'

    # Flask-Login requires this method
    def get_id(self):
       return self.id

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    # user_id = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=True) # Link to user if transactions are user-specific

    def __repr__(self):
        return f'<Transaction {self.id} - {self.description}>'

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'date': self.date.isoformat() # Format date for JSON
        }