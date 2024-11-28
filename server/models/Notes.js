const { default: mongoose } = require('mongoose');

const NotesSchema = mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notes', NotesSchema);
