const mongoose = require('mongoose')

const nodeSchema = new mongoose.Schema({
    type: { type: String, default: 'node' },
  id: { type: Number, required: true, unique: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  tags: { type: Object },
})

module.exports = mongoose.model('Node', nodeSchema)