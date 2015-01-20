var mongoose = require('mongoose');

var TodoSchema = new mongoose.Schema({
  name: String,
  completed: { type: Boolean, default: false },
  updated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Todo', TodoSchema);