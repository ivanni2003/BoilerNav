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

HeatMapSchema.pre('save', function (next) {
    if (this.expirationDates.length > 0) {
        this.lastExpirationDate = new Date(Math.max(...this.expirationDates.map(date => date.getTime())));
    }
    next();
});

HeatMapSchema.methods.removeExpiredUIDs = function () {
    const now = new Date();

    // Filter UIDs and expirationDates where expiration date is still valid
    const validIndices = this.expirationDates
        .map((date, index) => (date > now ? index : null))
        .filter((index) => index !== null);

    this.uids = validIndices.map((index) => this.uids[index]);
    this.expirationDates = validIndices.map((index) => this.expirationDates[index]);

    // Ensure UIDs remain unique
    const seenUIDs = new Set();
    this.uids = this.uids.filter((uid, index) => {
        if (seenUIDs.has(uid)) {
            return false;
        }
        seenUIDs.add(uid);
        return true;
    });

    return this.save(); // Save the updated document to the database
};


module.exports = mongoose.model('Heatmap', HeatMapSchema);
