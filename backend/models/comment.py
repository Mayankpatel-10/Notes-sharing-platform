from bson import ObjectId
from datetime import datetime

class Comment:
    @staticmethod
    def collection(db):
        return db.comments

    @staticmethod
    def create(db, comment_data):
        comment_data['createdAt'] = datetime.utcnow()
        return Comment.collection(db).insert_one(comment_data)

    @staticmethod
    def find_by_note(db, note_id):
        comments = list(Comment.collection(db).find({'noteId': ObjectId(note_id)}).sort('createdAt', -1))
        for comment in comments:
            comment['_id'] = str(comment['_id'])
            comment['noteId'] = str(comment['noteId'])
            comment['userId'] = str(comment['userId'])
        return comments

    @staticmethod
    def delete_by_id(db, comment_id):
        return Comment.collection(db).delete_one({'_id': ObjectId(comment_id)})
