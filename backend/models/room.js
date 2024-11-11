const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  newRoomName: { type: String, required: true },
  floorNumber: { type: String, required: true },
  tags: { type: Object },
  /*
    Not using lat/lon (or do we?)
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  */
})

module.exports = mongoose.model('Room', roomSchema)