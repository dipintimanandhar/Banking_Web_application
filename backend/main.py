# main.py
# Import necessary functions and models
from database_gcp import get_all_accounts, upsert_user_profile, UserProfile, get_all_transactions,get_user_profile
from flask import Flask, request, jsonify, Response # Use jsonify for responses
from flask_cors import CORS
from pydantic import ValidationError # To catch validation errors

def create_app():
    app = Flask(__name__)
    # Configure CORS more securely for production if possible
    # e.g., CORS(app, origins=["http://your-react-app-domain.com"])
    CORS(app, origins="*")
    return app

app = create_app()
@app.route('/transactions', methods=['GET', 'OPTIONS'])
def get_transactions_route():
    if request.method == 'OPTIONS':
        # Preflight request. Reply successfully:
        return Response(status=200)
    elif request.method == 'GET':
        try:
            transactions_json = get_all_transactions()
            # Return as JSON response with correct content type
            return Response(transactions_json, mimetype='application/json', status=200)
        except Exception as e:
            # Log the error for debugging
            app.logger.error(f"Error getting transactions route: {e}")
            return jsonify({"error": "Failed to retrieve transactions"}), 500
@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/accounts', methods=['GET', 'OPTIONS'])
def get_accounts_route():
    if request.method == 'OPTIONS':
        # Preflight request. Reply successfully:
        return Response(status=200)
    elif request.method == 'GET':
        try:
            accounts_json = get_all_accounts()
            # Return as JSON response with correct content type
            return Response(accounts_json, mimetype='application/json', status=200)
        except Exception as e:
            # Log the error for debugging
            app.logger.error(f"Error getting accounts: {e}")
            return jsonify({"error": "Failed to retrieve accounts"}), 500

@app.route('/profile', methods=['POST', 'OPTIONS'])
def handle_profile_post():
    if request.method == 'OPTIONS':
        return Response(status=200)

    # --- POST Logic remains the same ---
    elif request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON payload"}), 400
        try:
            profile_data = UserProfile(**data)
            success = upsert_user_profile(profile_data)
            if success:
                return jsonify({"message": "Profile updated successfully"}), 200
            else:
                return jsonify({"error": "Failed to update profile"}), 500
        except ValidationError as e:
             return jsonify({"error": "Validation failed", "details": e.errors()}), 422
        except Exception as e:
            app.logger.error(f"Error processing profile update: {e}")
            return jsonify({"error": "An unexpected error occurred"}), 500


# Optional: Add a cleanup hook for the connector if needed
# @app.teardown_appcontext
# def shutdown_session(exception=None):
#    from database_gcp import cleanup_connector
#    cleanup_connector()
@app.route('/profile', methods=['GET'])
def handle_profile_get():
    # Get email from query parameter (e.g., /profile?email=test@example.com)
    user_email = request.args.get('email')

    if not user_email:
        return jsonify({"error": "Missing 'email' query parameter"}), 400

    try:
        # Fetch profile data from DB using the new function
        db_profile_data: Optional[UserProfile] = get_user_profile(user_email)

        if db_profile_data:
            # Return the fetched profile data as JSON
            # Use model_dump() for Pydantic V2+ to convert model to dict for jsonify
            return jsonify(db_profile_data.model_dump()), 200
        else:
            # No profile found in our database for this user
            return jsonify({"message": "Profile not found in database"}), 404

    except Exception as e:
        app.logger.error(f"Error fetching profile for {user_email}: {e}")
        return jsonify({"error": "An unexpected error occurred fetching profile"}), 500

if __name__ == '__main__':
    # Set debug=False for production
    app.run(debug=True, host='0.0.0.0', port=5000)