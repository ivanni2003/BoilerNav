const mongoose = require("mongoose");

const navNodeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  ways: [{ type: Number }],
  latitude: { type: Number },
  longitude: { type: Number },
});

module.exports = mongoose.model("NavNode", navNodeSchema);
