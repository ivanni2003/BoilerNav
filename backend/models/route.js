const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startLocation: {
    lat: Number,
    lon: Number,
    name: String
  },
  endLocation: {
    lat: Number,
    lon: Number,
    name: String
  },
  distance: Number,
  duration: Number,
  travelMode: String,
  polyline: [{ lat: Number, lon: Number }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);