const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Note = require('../models/Note');
const { auth, adminAuth } = require('../middleware/auth');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload note
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, subject, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'notes-sharing',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const note = new Note({
      title,
      subject,
      description,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
    });

    await note.save();

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all notes with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, subject } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    const notes = await Note.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('uploadedBy', 'name email');
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download note (increment download count)
router.get('/:id/download', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.downloads += 1;
    await note.save();

    // Stream file from Cloudinary
    const response = await fetch(note.fileUrl);
    if (!response.ok) {
      return res.status(500).json({ message: 'Failed to fetch file from Cloudinary' });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${note.fileName}"`);
    
    // Pipe the file stream
    response.body.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like note
router.post('/:id/like', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const hasLiked = note.likedBy.includes(req.user._id);

    if (hasLiked) {
      note.likedBy.pull(req.user._id);
      note.likes -= 1;
    } else {
      note.likedBy.push(req.user._id);
      note.likes += 1;
    }

    await note.save();

    res.json({ likes: note.likes, liked: !hasLiked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user is owner or admin
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    // Delete from Cloudinary
    const publicId = note.fileUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`notes-sharing/${publicId}`);

    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's notes
router.get('/user/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.user._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
