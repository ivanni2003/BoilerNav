const mongoose = require('mongoose');

const waySchema = new mongoose.Schema({
  type: { type: String, default: 'way' },
  id: { type: Number, required: true, unique: true },
  nodes: [{ type: Number }], 
  tags: { type: Object }, 
});

module.exports = mongoose.model('Way', waySchema)