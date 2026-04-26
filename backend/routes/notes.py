from flask import Blueprint, request, jsonify, redirect
from werkzeug.utils import secure_filename
from datetime import datetime
import cloudinary
import cloudinary.uploader
from models.note import Note
from models.user import User
from config.db import Database
from middleware.auth import auth_required, admin_required

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/upload', methods=['POST'])
@auth_required
def upload_note():
    try:
        title = request.form.get('title')
        subject = request.form.get('subject')
        description = request.form.get('description')
        file = request.files.get('file')

        if not file:
            return jsonify({'message': 'No file uploaded'}), 400

        # Upload to Cloudinary with raw resource type for PDF files
        try:
            # Get file extension
            file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
            public_id = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
            
            result = cloudinary.uploader.upload(
                file,
                resource_type='raw',
                folder='notes-sharing',
                type='upload',
                public_id=public_id
            )
            print(f'Cloudinary upload result: {result}')
            print(f'Secure URL: {repr(result.get("secure_url"))}')
        except Exception as cloudinary_error:
            print(f'Cloudinary Upload Error: {cloudinary_error}')
            return jsonify({'message': f'Cloudinary upload failed: {str(cloudinary_error)}'}), 500

        db = Database.get_db()
        note_data = {
            'title': title,
            'subject': subject,
            'description': description,
            'fileUrl': result['secure_url'],
            'fileName': file.filename,
            'uploadedBy': request.user['_id']
        }

        result = Note.create(db, note_data)
        note = Note.find_by_id(db, result.inserted_id)
        note['_id'] = str(note['_id'])
        note['uploadedBy'] = str(note['uploadedBy'])

        return jsonify(note), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@notes_bp.route('/', methods=['GET'])
def get_notes():
    try:
        search = request.args.get('search')
        subject = request.args.get('subject')

        db = Database.get_db()
        notes = Note.find_all(db, search, subject)

        # Populate user info
        for note in notes:
            user = User.find_by_id(db, note['uploadedBy'])
            if user:
                note['uploadedBy'] = {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email']
                }

        return jsonify(notes)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@notes_bp.route('/<note_id>', methods=['GET'])
def get_note(note_id):
    try:
        db = Database.get_db()
        note = Note.find_by_id(db, note_id)
        
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        note['_id'] = str(note['_id'])
        note['uploadedBy'] = str(note['uploadedBy'])
        
        user = User.find_by_id(db, note['uploadedBy'])
        if user:
            note['uploadedBy'] = {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email']
            }

        return jsonify(note)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@notes_bp.route('/<note_id>/download', methods=['GET'])
def download_note(note_id):
    try:
        print(f'\n=== DOWNLOAD REQUEST ===')
        print(f'note_id: {note_id}')
        db = Database.get_db()
        note = Note.find_by_id(db, note_id)
        
        if not note:
            print(f'Note not found: {note_id}')
            return jsonify({'message': 'Note not found'}), 404

        print(f'Note found: {note.get("title")}')
        print(f'Raw fileUrl from DB: {repr(note["fileUrl"])}')
        
        Note.increment_downloads(db, note_id)

        # Redirect to local file URL
        download_url = note['fileUrl']
        print(f'Redirecting to: {download_url}')
        print(f'====================\n')
        
        return redirect(download_url)
    except Exception as e:
        print(f'Download error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'message': str(e)}), 500

@notes_bp.route('/<note_id>/like', methods=['POST'])
@auth_required
def like_note(note_id):
    try:
        db = Database.get_db()
        note = Note.find_by_id(db, note_id)
        
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        user_id = str(request.user['_id'])
        liked_by = note.get('likedBy', [])
        
        # Convert to ObjectId for comparison
        from bson import ObjectId
        liked_by_oids = [ObjectId(uid) if isinstance(uid, str) else uid for uid in liked_by]
        user_oid = ObjectId(user_id)
        
        has_liked = user_oid in liked_by_oids

        if has_liked:
            new_likes = Note.update_likes(db, note_id, user_id, increment=False)
            liked = False
        else:
            new_likes = Note.update_likes(db, note_id, user_id, increment=True)
            liked = True

        return jsonify({'likes': new_likes, 'liked': liked})
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@notes_bp.route('/<note_id>', methods=['DELETE'])
@auth_required
def delete_note(note_id):
    try:
        db = Database.get_db()
        note = Note.find_by_id(db, note_id)
        
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        # Check if user is owner or admin
        if str(note['uploadedBy']) != str(request.user['_id']) and request.user.get('role') != 'admin':
            return jsonify({'message': 'Not authorized to delete this note'}), 403

        # Delete from Cloudinary
        public_id = note['fileUrl'].split('/')[-1].split('.')[0]
        cloudinary.uploader.destroy(f'notes-sharing/{public_id}')

        Note.delete_by_id(db, note_id)

        return jsonify({'message': 'Note deleted successfully'})
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@notes_bp.route('/user/notes', methods=['GET'])
@auth_required
def get_user_notes():
    try:
        db = Database.get_db()
        notes = Note.find_by_user(db, str(request.user['_id']))

        # Populate user info
        for note in notes:
            user = User.find_by_id(db, note['uploadedBy'])
            if user:
                note['uploadedBy'] = {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email']
                }

        return jsonify(notes)
    except Exception as e:
        return jsonify({'message': str(e)}), 500
