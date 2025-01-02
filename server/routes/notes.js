const express = require('express');
const router = express.Router();
const Note = require('../models/Notes');

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ date: -1 });
    res.json(notes);
  } catch (error) {
    res.json({ message: error });
  }
});

router.patch('/:noteId', async (req, res) => {
  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.noteId,
      { text: req.body.text },
      { new: true }
    );
    res.json(updatedNote);
  } catch (error) {
    res.json({ message: error });
  }
});

router.post('/', async (req, res) => {
  const note = new Note({
    text: req.body.text,
  });
  try {
    const savedNote = await note.save();
    res.json(savedNote);
  } catch (error) {
    res.json({ message: error });
  }
});

// DELETE
router.delete('/:noteId', async (req, res) => {
  try {
    const result = await Note.deleteOne({ _id: req.params.noteId });
    res.json({ deleted: result.deletedCount === 1 }); // True if 1 doc deleted
  } catch (error) {
    res.json({ message: error });
  }
});
router.delete('/', async (req, res) => {
  try {
    const deleteResult = await Note.deleteMany({}); // Empty filter deletes all
    res.json({ message: `Deleted ${deleteResult.deletedCount} notes` });
  } catch (error) {
    res.json({ message: error });
  }
});

module.exports = router;
