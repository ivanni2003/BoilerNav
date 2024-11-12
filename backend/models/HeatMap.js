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
    uids: {
        type: [String],
        required: true
    },
    expirationDates: {
        type: [Date],
        required: true
    },
    lastExpirationDate: {
        type: Date,
        required: true
    }
});

// Set up an automatic TTL index to delete expired tokens
HeatMapSchema.index({ lastExpirationDate: 1 }, { expireAfterSeconds: 0 });

heatmapSchema.pre('save', function (next) {
    if (this.expirationDates.length > 0) {
        this.lastExpirationDate = new Date(Math.max(...this.expirationDates.map(date => date.getTime())));
    }
    next();
});

module.exports = mongoose.model('Heatmap', HeatMapSchema);
