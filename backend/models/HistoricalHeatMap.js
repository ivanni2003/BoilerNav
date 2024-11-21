const mongoose = require('mongoose');

const HistoricalHeatMapSchema = new mongoose.Schema({
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
        unique: false
    },
    expirationDate: {
        type: Date,
        required: true
    },
    Date: {
        type: Date,
        required: true,
        default: Date.now()
    }
    
});

// Set up an automatic TTL index to delete expired tokens
HistoricalHeatMapSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });


module.exports = mongoose.model('HistoricalHeatmap', HistoricalHeatMapSchema);
