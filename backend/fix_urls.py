from config.db import Database
from models.note import Note
from bson import ObjectId

db = Database.connect()
notes = Note.collection(db).find({})
print(f'Total notes: {notes.count()}')

for note in notes:
    old_url = note['fileUrl']
    print(f'Raw URL: {repr(old_url)}')
    # Remove newlines and extra spaces
    new_url = old_url.replace('\n', '').replace(' ', '').replace('\r', '')
    
    if old_url != new_url:
        print(f'Fixing URL for: {note["title"]}')
        print(f'Old: {old_url}')
        print(f'New: {new_url}')
        
        # Update in database
        Note.collection(db).update_one(
            {'_id': note['_id']},
            {'$set': {'fileUrl': new_url}}
        )
        print('Updated successfully')
        print('---')
    else:
        print(f'URL already clean for: {note["title"]}')

print('URL fixing complete')
