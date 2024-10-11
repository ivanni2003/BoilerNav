const mongoose = require('mongoose');

const floorPlanSchema = new mongoose.Schema({
  buildingId: { type: Number, required: true },
  floorNumber: { type: String, required: true },
  imageUrl: { type: String, required: true }
});

module.exports = mongoose.model('FloorPlan', floorPlanSchema);