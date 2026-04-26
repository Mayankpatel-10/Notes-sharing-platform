const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');

// Add comment
router.post('/', auth, async (req, res) => {
  try {
    const { noteId, text } = req.body;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const comment = new Comment({
      noteId,
      userId: req.user._id,
      text,
    });

    await comment.save();
    await comment.populate('userId', 'name email');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get comments for a note
router.get('/:noteId', async (req, res) => {
  try {
    const comments = await Comment.find({ noteId: req.params.noteId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
