const mongoose = require('mongoose');

const HeatMapSchema = new mongoose.Schema({
    lat: {
        type: Number,
        required: true
    },
    long: {
        type: Number,
        required: true
    },
    uid: {
        type: String,
        required: true,
        unique: true
    },
    expirationDate: {
        type: Date,
        required: true
    }
});

// Set up an automatic TTL index to delete expired tokens
HeatMapSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });


module.exports = mongoose.model('Heatmap', HeatMapSchema);
