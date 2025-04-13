
## Setup and Installation

### Prerequisites

*    npm (or yarn)
*   Python 3.x and pip
*   Access to a Google Cloud Platform project with:
    *   A Cloud SQL (PostgreSQL) instance configured.
    *   Google OAuth 2.0 Credentials (Client ID).
    *   Cloud SQL Admin API enabled.
    *   Service Account key or appropriate IAM permissions for the Cloud SQL Python Connector (if running locally and not on Cloud Run/App Engine).

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-url>/backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # On Windows:
    # .\venv\Scripts\activate
    # On macOS/Linux:
    # source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    *   Create a `.env` file in the `backend` directory.
    *   Copy the contents from `.env.example` (if you create one) or add the following variables, replacing the placeholder values with your actual credentials:

        ```properties
        # backend/.env
        FLASK_ENV=development
        SECRET_KEY='YOUR_FLASK_SECRET_KEY' # Generate a strong, random key

        # Google OAuth
        GOOGLE_CLIENT_ID='YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
        GOOGLE_DISCOVERY_URL="https://accounts.google.com/.well-known/openid-configuration"

        # Cloud SQL Connection Details (using Python Connector)
        DB_USER='YOUR_DB_USER'
        DB_PASSWORD='YOUR_DB_PASSWORD'
        DB_NAME='YOUR_DB_NAME'
        DB_CONNECTION_NAME='YOUR_GCP_PROJECT:REGION:INSTANCE_NAME' # e.g., my-project:us-central1:my-instance

        # Frontend URL
        FRONTEND_URL='http://localhost:3000' # Or your frontend's running URL
        ```
    *   **Important:** Ensure the service account running your backend (or your local environment if using Application Default Credentials) has the "Cloud SQL Client" IAM role for the specified instance.

5.  **Database Initialization (If applicable):**
    *   If you have database migrations or an initialization script, run it here. For example, using Flask-Migrate:
        ```bash
        # flask db init  # Run only once to initialize migrations
        # flask db migrate -m "Initial migration"
        # flask db upgrade
        ```
    *   Or, if using SQLAlchemy directly, ensure tables are created (e.g., via `db.create_all()` in your Flask app context).

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    # Or from the root: cd <your-repository-url>/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Configure Environment Variables (if needed):**
    *   The frontend primarily needs the Google Client ID for the login button. This is often embedded directly or placed in a `.env` file recognized by Vite (prefixed with `VITE_`). Create a `.env` file in the `frontend` directory:
        ```properties
        # frontend/.env
        VITE_GOOGLE_CLIENT_ID='YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
        ```
    *   Make sure to access this in your code using `import.meta.env.VITE_GOOGLE_CLIENT_ID`.

## Running the Application

1.  **Start the Backend Server:**
    *   Make sure you are in the `backend` directory with the virtual environment activated.
    *   Run the Flask development server:
        ```bash
        flask run
        # Or python app.py if configured differently
        ```
    *   The backend should typically be running on `http://127.0.0.1:5000`.

2.  **Start the Frontend Development Server:**
    *   Open a *new* terminal window.
    *   Navigate to the `frontend` directory.
    *   Run the Vite development server:
        ```bash
        npm run dev
        # or yarn dev
        ```
    *   The frontend should typically be running on `http://localhost:3000`.

3.  **Access the Application:**
    *   Open your web browser and navigate to `http://localhost:3000`.

## Environment Variables Summary

### Backend (`backend/.env`)

*   `FLASK_ENV`: Set to `development` or `production`.
*   `SECRET_KEY`: A secret key for Flask session management.
*   `GOOGLE_CLIENT_ID`: Your Google Cloud OAuth Client ID.
*   `GOOGLE_DISCOVERY_URL`: Google's OpenID configuration endpoint.
*   `DB_USER`: Cloud SQL database user.
*   `DB_PASSWORD`: Cloud SQL database user's password.
*   `DB_NAME`: Cloud SQL database name.
*   `DB_CONNECTION_NAME`: Cloud SQL instance connection name (`project:region:instance`).
*   `FRONTEND_URL`: The URL where the frontend application is accessible (used for redirects).

### Frontend (`frontend/.env`)

*   `VITE_GOOGLE_CLIENT_ID`: Your Google Cloud OAuth Client ID (must be prefixed with `VITE_` for Vite).

---

_Feel free to add more sections like API Endpoints, Deployment Notes, Contributing Guidelines, or License information as needed!_
