var mongoose = require('mongoose'),

    TodoSchema = new mongoose.Schema({
        name: { type: String, required: true },
        author: { type: String, required: true },
        completed: { type: Boolean, default: false },
        order: { type: Number, required: true },
        updated: { type: Date, default: Date.now },
    });

module.exports = mongoose.model('Todo', TodoSchema);