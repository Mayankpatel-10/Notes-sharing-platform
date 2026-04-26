from config.db import Database
from models.note import Note

db = Database.connect()
result = Note.collection(db).delete_many({})
print(f'Deleted {result.deleted_count} old notes')
