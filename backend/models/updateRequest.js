const mongoose = require('mongoose');

const updateRequestSchema = new mongoose.Schema({
  buildingName: String,
  roomId: Number,
  newRoomName: String,
  username: String,
  date: { type: Date, default: Date.now }
});

const UpdateRequest = mongoose.model('UpdateRequest', updateRequestSchema);

module.exports = UpdateRequest;