from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
from models.user import User
from config.db import Database
from middleware.auth import auth_required, admin_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        db = Database.get_db()
        existing_user = User.find_by_email(db, email)
        if existing_user:
            return jsonify({'message': 'User already exists'}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        user_data = {
            'name': name,
            'email': email,
            'password': hashed_password.decode('utf-8')
        }

        result = User.create(db, user_data)
        token = create_access_token(identity=str(result.inserted_id))

        return jsonify({
            'token': token,
            'user': {
                'id': str(result.inserted_id),
                'name': name,
                'email': email,
                'role': 'user'
            }
        }), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        db = Database.get_db()
        user = User.find_by_email(db, email)
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 400

        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 400

        token = create_access_token(identity=str(user['_id']))

        return jsonify({
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user.get('role', 'user')
            }
        })
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/google', methods=['POST'])
def google_login():
    try:
        data = request.json
        id_token = data.get('idToken')
        
        # Firebase verification would go here
        # For now, we'll skip it
        
        db = Database.get_db()
        user = User.find_by_email(db, email)
        
        if not user:
            user_data = {
                'name': name,
                'email': email,
                'firebaseUid': uid
            }
            result = User.create(db, user_data)
            user_id = str(result.inserted_id)
        else:
            user_id = str(user['_id'])

        token = create_access_token(identity=user_id)

        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'name': user.get('name', name),
                'email': user.get('email', email),
                'role': user.get('role', 'user')
            }
        })
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    try:
        db = Database.get_db()
        users = User.find_all(db)
        return jsonify(users)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    try:
        db = Database.get_db()
        user = User.find_by_id(db, user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404

        if user.get('role') == 'admin':
            return jsonify({'message': 'Cannot delete admin users'}), 403

        User.delete_by_id(db, user_id)
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        return jsonify({'message': str(e)}), 500
