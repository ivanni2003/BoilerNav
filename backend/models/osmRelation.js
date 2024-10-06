const mongoose = require('mongoose');

const relationSchema = new mongoose.Schema({
  type: { type: String, default: 'relation' },
  id: { type: Number, required: true, unique: true },
  members: [{ 
    type: {
      type: String, 
      required: true
    },
    ref: { type: Number, required: true } 
  }],
  tags: { type: Object }, 
});

module.exports = mongoose.model('Relation', relationSchema)