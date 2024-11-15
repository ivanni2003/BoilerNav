const mongoose = require("mongoose");

const geometrySchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const propertiesSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { type: String, required: true },
  roomName: { type: String, required: true },
  linkedTo: [{ type: Number }],
  floor: { type: Number, required: true },
});

const featureSchema = new mongoose.Schema({
  properties: propertiesSchema,
  geometry: geometrySchema,
});

const floorSchema = new mongoose.Schema({
  floorName: { type: String, required: true },
  floorIndex: { type: Number, required: true },
});

const featureCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  floors: [floorSchema],
  features: [featureSchema],
  scale: { type: Number, required: true },
});

module.exports = mongoose.model("IndoorNav", featureCollectionSchema);
