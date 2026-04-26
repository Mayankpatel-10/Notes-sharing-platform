from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    _client = None
    _db = None

    @classmethod
    def connect(cls):
        if cls._client is None:
            mongo_uri = os.getenv('MONGODB_URI')
            cls._client = MongoClient(mongo_uri)
            cls._db = cls._client.get_database()
            print('MongoDB Connected Successfully')
        return cls._db

    @classmethod
    def get_db(cls):
        if cls._db is None:
            return cls.connect()
        return cls._db

    @classmethod
    def close(cls):
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
