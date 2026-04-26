from bson import ObjectId
from datetime import datetime

class Note:
    @staticmethod
    def collection(db):
        return db.notes

    @staticmethod
    def create(db, note_data):
        note_data['createdAt'] = datetime.utcnow()
        note_data['likes'] = 0
        note_data['downloads'] = 0
        note_data['likedBy'] = []
        return Note.collection(db).insert_one(note_data)

    @staticmethod
    def find_by_id(db, note_id):
        return Note.collection(db).find_one({'_id': ObjectId(note_id)})

    @staticmethod
    def find_all(db, search=None, subject=None):
        query = {}
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        if subject:
            query['subject'] = {'$regex': subject, '$options': 'i'}
        
        notes = list(Note.collection(db).find(query).sort('createdAt', -1))
        for note in notes:
            note['_id'] = str(note['_id'])
            note['uploadedBy'] = str(note['uploadedBy'])
        return notes

    @staticmethod
    def find_by_user(db, user_id):
        notes = list(Note.collection(db).find({'uploadedBy': ObjectId(user_id)}).sort('createdAt', -1))
        for note in notes:
            note['_id'] = str(note['_id'])
            note['uploadedBy'] = str(note['uploadedBy'])
        return notes

    @staticmethod
    def update_likes(db, note_id, user_id, increment=True):
        note = Note.find_by_id(db, note_id)
        if not note:
            return None
        
        user_oid = ObjectId(user_id)
        if increment:
            if user_oid not in note.get('likedBy', []):
                Note.collection(db).update_one(
                    {'_id': ObjectId(note_id)},
                    {'$push': {'likedBy': user_oid}, '$inc': {'likes': 1}}
                )
                return Note.find_by_id(db, note_id)['likes']
        else:
            if user_oid in note.get('likedBy', []):
                Note.collection(db).update_one(
                    {'_id': ObjectId(note_id)},
                    {'$pull': {'likedBy': user_oid}, '$inc': {'likes': -1}}
                )
                return Note.find_by_id(db, note_id)['likes']
        return note['likes']

    @staticmethod
    def increment_downloads(db, note_id):
        Note.collection(db).update_one(
            {'_id': ObjectId(note_id)},
            {'$inc': {'downloads': 1}}
        )

    @staticmethod
    def delete_by_id(db, note_id):
        return Note.collection(db).delete_one({'_id': ObjectId(note_id)})

    @staticmethod
    def to_dict(note):
        if note:
            note['_id'] = str(note['_id'])
            note['uploadedBy'] = str(note['uploadedBy'])
            if 'likedBy' in note:
                note['likedBy'] = [str(uid) for uid in note['likedBy']]
        return note
