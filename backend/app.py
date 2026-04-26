from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config.db import Database
from routes.auth import auth_bp
from routes.notes import notes_bp
from routes.comments import comments_bp
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-secret-key-change-this-in-production')
jwt = JWTManager(app)

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Connect to MongoDB
Database.connect()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(notes_bp, url_prefix='/api/notes')
app.register_blueprint(comments_bp, url_prefix='/api/comments')

# Health check
@app.route('/')
def health_check():
    return jsonify({'message': 'Notes Sharing API is running'})

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=PORT, debug=True)
