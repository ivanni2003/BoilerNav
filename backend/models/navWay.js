const mongoose = require("mongoose");

const navWaySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  nodes: [{ type: Number }],
  length: { type: Number },
  connectedWays: [{ type: Number }],
  type: { type: String, default: "footpath" },
  tags: { type: Object }, // Used to store additional information, including bus stop tags
  isBusStop: { type: Boolean, default: false }, // New field to indicate bus stops
});

module.exports = mongoose.model("NavWay", navWaySchema);
