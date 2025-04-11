# database_gcp.py
from typing import List, Optional
from pydantic import BaseModel, EmailStr # Use EmailStr for email validation
from google.cloud.sql.connector import Connector, IPTypes
import sqlalchemy
import os # Good practice to get credentials from environment variables
from datetime import date, datetime # Import date and datetime
from decimal import Decimal
# --- Configuration ---
# Best practice: Load credentials from environment variables
# Example: export DB_USER="admin"
#          export DB_PASS="admin"
#          export DB_NAME="postgres"
#          export INSTANCE_CONNECTION_NAME="learningproj-365113:us-central1:react-db"

DB_USER = os.environ.get("DB_USER", "admin")
DB_PASS = os.environ.get("DB_PASS", "admin")
DB_NAME = os.environ.get("DB_NAME", "postgres")
INSTANCE_CONNECTION_NAME = os.environ.get("INSTANCE_CONNECTION_NAME", "learningproj-365113:us-central1:react-db")
IP_TYPE = IPTypes.PRIVATE if os.environ.get("PRIVATE_IP") else IPTypes.PUBLIC

# --- Pydantic Models ---
class Account(BaseModel):
    id: int
    number: str
    userId: int

class AccountListResponse(BaseModel):
    accounts: List[Account]

class UserProfile(BaseModel):
    email_address: EmailStr # Use Pydantic's email validation
    name: str
    phone_number: Optional[str] = None # Optional fields
    address: Optional[str] = None

# --- Database Connection Setup (Initialize once) ---
connector = Connector(ip_type=IP_TYPE)
class Transaction(BaseModel):
    transaction_id: int
    user_id: int
    transaction_date: datetime         # Use date type
    description: Optional[str] = None # Allow description to be optional/nullable
    amount: Decimal                # Use Decimal for precision with money
    type: str                      # e.g., 'income', 'expense'
    category: Optional[str] = None # Allow category to be optional/nullable
    created_at: datetime           # Use datetime type

class TransactionListResponse(BaseModel):
    transactions: List[Transaction]
# Function to get connection credentials
def getconn():
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME
    )
    return conn

def get_user_profile(email: str) -> Optional[UserProfile]:
    """Fetches a user profile from the database based on email_address."""
    # Note: Ensure column names match your table exactly in the SELECT list
    query = sqlalchemy.text("""
        SELECT email_address, name, phone_number, address
        FROM bank_users
        WHERE email_address = :email_param
        LIMIT 1
    """)
    try:
        with pool.connect() as db_conn:
            result = db_conn.execute(query, parameters={"email_param": email})
            row = result.fetchone() # Fetches the first row or None

            if row:
                # Map row data to the Pydantic model
                # Indices depend on the SELECT order: 0=email, 1=name, 2=phone, 3=address
                return UserProfile(
                    email_address=row[0],
                    name=row[1],
                    phone_number=row[2], # Will be None if DB column is NULL
                    address=row[3]       # Will be None if DB column is NULL
                )
            else:
                # No profile found for this email in our DB
                return None
    except Exception as e:
        print(f"Error fetching profile for {email}: {e}")
        # In case of error, return None or re-raise exception
        return None

def get_all_transactions() -> str:
    """Fetches all transactions from the 'transactions' table."""
    transaction_data: List[Transaction] = []
    # Define the columns to select to ensure order and handle potential nulls
    # Adjust column names if they differ slightly (e.g., case sensitivity)
    query = sqlalchemy.text("""
        SELECT
            *
        FROM transactions
        
    """)
    try:
        with pool.connect() as db_conn:
            result = db_conn.execute(query)
            for row in result:
                # Map row data to the Pydantic model
                transaction_data.append(
                    Transaction(
                        transaction_id=row[0],
                        user_id=row[1],
                        transaction_date=row[2],
                        description=row[3],
                        amount=row[4], # SQLAlchemy/pg8000 should handle Decimal conversion
                        type=row[5],
                        category=row[6],
                        created_at=row[7]
                    )
                )
        # Use model_dump_json for Pydantic v2+
        return TransactionListResponse(transactions=transaction_data).model_dump_json(indent=2)
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        # Return empty list on error
        return TransactionListResponse(transactions=[]).model_dump_json(indent=2)

# Create the SQLAlchemy engine globally
# The pool is managed automatically by SQLAlchemy
pool = sqlalchemy.create_engine(
    "postgresql+pg8000://",
    creator=getconn,
    pool_size=5,        # Example: Adjust pool size as needed
    max_overflow=2,
    pool_timeout=30,    # seconds
    pool_recycle=1800,  # seconds (recycle connections periodically)
)

# --- Database Interaction Functions ---
def get_all_accounts() -> str:
    """Fetches all accounts from the 'account' table."""
    account_data: List[Account] = []
    try:
        with pool.connect() as db_conn:
            result = db_conn.execute(sqlalchemy.text("SELECT id, number, \"userid\" FROM account")) # Ensure column names match case if needed (like userId)
            for row in result:
                # Access columns by index (0, 1, 2) or name if known and safe
                account_data.append(
                    Account(id=row[0], number=row[1], userId=row[2])
                )
        return AccountListResponse(accounts=account_data).model_dump_json(indent=2) # Use model_dump_json for Pydantic v2+
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        # Consider raising the exception or returning an error structure
        return AccountListResponse(accounts=[]).model_dump_json(indent=2) # Return empty list on error

def upsert_user_profile(profile_data: UserProfile):
    """Inserts a new user profile or updates an existing one based on email."""
    stmt = sqlalchemy.text("""
        INSERT INTO bank_users(email_address, name, phone_number, address)
        VALUES (:email_address, :name, :phone_number, :address)
        ON CONFLICT (email_address) DO UPDATE SET
            name = EXCLUDED.name,
            phone_number = EXCLUDED.phone_number,
            address = EXCLUDED.address;
    """)
    try:
        with pool.connect() as db_conn:
            # Pydantic v2+ uses model_dump()
            db_conn.execute(stmt, parameters=profile_data.model_dump())
            db_conn.commit() # Important: Commit the transaction
        print(f"Successfully upserted profile for {profile_data.email_address}")
        return True
    except Exception as e:
        print(f"Error upserting profile for {profile_data.email_address}: {e}")
        # Consider raising the exception
        return False

# Optional: Add a cleanup function for the connector if needed,
# though usually managed within the application lifecycle.
# def cleanup_connector():
#    connector.close()

# Example usage (optional, for testing database_gcp.py directly)
if __name__ == "__main__":
    print("Testing database connection and functions...")
    print("\nFetching accounts:")
    accounts_json = get_all_accounts()
    print(accounts_json)

    print("\nUpserting sample profile:")
    sample_profile = UserProfile(
        email="test.user@example.com",
        name="Test User",
        phone_number="123-456-7890",
        address="123 Test St, Anytown"
    )
    success = upsert_user_profile(sample_profile)
    print(f"Upsert successful: {success}")

    # Remember to close the connector when the application exits
    # This might be handled in your main app's shutdown hook
    # cleanup_connector()