from flask import Blueprint, request, jsonify
from models.comment import Comment
from models.note import Note
from models.user import User
from config.db import Database
from middleware.auth import auth_required

comments_bp = Blueprint('comments', __name__)

@comments_bp.route('/<note_id>', methods=['POST'])
@auth_required
def add_comment(note_id):
    try:
        data = request.json
        text = data.get('text')

        db = Database.get_db()
        note = Note.find_by_id(db, note_id)
        
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        comment_data = {
            'noteId': note_id,
            'userId': str(request.user['_id']),
            'text': text
        }

        result = Comment.create(db, comment_data)
        comment = Comment.collection(db).find_one({'_id': result.inserted_id})
        comment['_id'] = str(comment['_id'])
        comment['noteId'] = str(comment['noteId'])
        comment['userId'] = str(comment['userId'])

        return jsonify(comment), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@comments_bp.route('/<note_id>', methods=['GET'])
def get_comments(note_id):
    try:
        db = Database.get_db()
        comments = Comment.find_by_note(db, note_id)

        # Populate user info
        for comment in comments:
            user = User.find_by_id(db, comment['userId'])
            if user:
                comment['userId'] = {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email']
                }

        return jsonify(comments)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@comments_bp.route('/<comment_id>', methods=['DELETE'])
@auth_required
def delete_comment(comment_id):
    try:
        db = Database.get_db()
        comment = Comment.collection(db).find_one({'_id': ObjectId(comment_id)})
        
        if not comment:
            return jsonify({'message': 'Comment not found'}), 404

        # Check if user is owner or admin
        if str(comment['userId']) != str(request.user['_id']) and request.user.get('role') != 'admin':
            return jsonify({'message': 'Not authorized to delete this comment'}), 403

        Comment.delete_by_id(db, comment_id)

        return jsonify({'message': 'Comment deleted successfully'})
    except Exception as e:
        return jsonify({'message': str(e)}), 500
