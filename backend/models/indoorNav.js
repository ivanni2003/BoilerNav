const mongoose = require("mongoose");

const geometrySchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const propertiesSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  Type: { type: String, required: true },
  RoomName: { type: String, required: true },
  LinkedTo: [{ type: Number }],
  Floor: { type: Number, required: true },
  DestinationCount: { type: Number, required: true, default: 0 },
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
  scale: { type: Number, required: true, default: -1 },
});

module.exports = mongoose.model("IndoorNav", featureCollectionSchema);
