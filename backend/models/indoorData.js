const mongoose = require('mongoose')

const geometrySchema = new mongoose.Schema({
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  });

  const propertiesSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    Type: { type: String, required: true },
    RoomName: { type: String, required: true },
    LinkedTo: { type: String, required: true },
    Floor: { type: Number, required: true }
  });

  const featureSchema = new mongoose.Schema({
    type: { type: String, enum: ['Feature'], required: true },
    properties: propertiesSchema,
    geometry: geometrySchema
  });

  const featureCollectionSchema = new mongoose.Schema({
    type: { type: String, enum: ['FeatureCollection'], required: true },
    name: { type: String, required: true },
    crs: {
      type: {
        type: String,
        required: true,
        enum: ['name']
      },
      properties: {
        name: { type: String, required: true }
      }
    },
    features: [featureSchema] 
  });
  
  module.exports = mongoose.model('IndoorData', featureCollectionSchema);