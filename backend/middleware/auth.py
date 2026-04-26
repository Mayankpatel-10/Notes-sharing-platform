from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from bson import ObjectId
from models.user import User
from config.db import Database

def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            db = Database.get_db()
            user = User.find_by_id(db, user_id)
            if not user:
                return jsonify({'message': 'User not found'}), 404
            request.user = user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'message': 'Invalid token'}), 401
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            db = Database.get_db()
            user = User.find_by_id(db, user_id)
            if not user or user.get('role') != 'admin':
                return jsonify({'message': 'Admin access required'}), 403
            request.user = user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'message': 'Invalid token'}), 401
    return decorated_function
