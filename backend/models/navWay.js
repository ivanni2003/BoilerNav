const mongoose = require("mongoose");

const navWaySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  nodes: [{ type: Number }],
  length: { type: Number },
  type: { type: String, default: "footpath" },
});

module.exports = mongoose.model("NavWay", navWaySchema);
