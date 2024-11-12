const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startLocation: {
    name: { type: String, default: 'Unknown Start' },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    floor: { type: Number }
  },
  endLocation: {
    name: { type: String, default: 'Unknown Destination' },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    floor: { type: Number }
  },
  distance: { type: Number, required: true },
  duration: { type: Number, required: true },
  travelMode: { type: String, required: true },
  polyline: [{
    x: { type: Number },
    y: { type: Number },
    floor: { type: Number },
    lat: { type: Number },
    lon: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: true },
  buildingId: { type: Number }
});

const Route = mongoose.model('Route', routeSchema);
module.exports = Route;