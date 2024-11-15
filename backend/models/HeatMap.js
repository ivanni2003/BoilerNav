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

HeatMapSchema.methods.removeExpiredUids = function () {
    const now = new Date();
    const validIndexes = this.expirationDates
      .map((date, index) => (date > now ? index : null))
      .filter((index) => index !== null);
  
    this.uids = validIndexes.map((index) => this.uids[index]);
    this.expirationDates = validIndexes.map((index) => this.expirationDates[index]);
    if (this.expirationDates.length > 0) {
      this.lastExpirationDate = new Date(Math.max(...this.expirationDates.map(date => date.getTime())));
    } else {
      this.lastExpirationDate = now; // Default to now if all dates are expired
    }
  };

module.exports = mongoose.model('Heatmap', HeatMapSchema);
