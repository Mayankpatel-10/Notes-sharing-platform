from config.db import Database
from models.note import Note

db = Database.connect()
notes = Note.find_all(db)
print(f'Total notes in database: {len(notes)}')
for note in notes:
    print(f'Title: {note["title"]}')
    print(f'File URL: {note["fileUrl"]}')
    print(f'---')
