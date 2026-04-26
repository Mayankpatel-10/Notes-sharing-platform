from bson import ObjectId
from datetime import datetime

class User:
    @staticmethod
    def collection(db):
        return db.users

    @staticmethod
    def create(db, user_data):
        user_data['createdAt'] = datetime.utcnow()
        user_data['role'] = user_data.get('role', 'user')
        return User.collection(db).insert_one(user_data)

    @staticmethod
    def find_by_email(db, email):
        return User.collection(db).find_one({'email': email})

    @staticmethod
    def find_by_id(db, user_id):
        return User.collection(db).find_one({'_id': ObjectId(user_id)})

    @staticmethod
    def find_all(db):
        return list(User.collection(db).find({}, {'password': 0}).sort('createdAt', -1))

    @staticmethod
    def delete_by_id(db, user_id):
        return User.collection(db).delete_one({'_id': ObjectId(user_id)})

    @staticmethod
    def to_dict(user):
        if user:
            user['_id'] = str(user['_id'])
            if 'password' in user:
                del user['password']
        return user
