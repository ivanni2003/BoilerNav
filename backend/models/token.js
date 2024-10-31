const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  email: { type: String, required: true }, // The email associated with the token
  token: { type: String, required: true }, // The reset token itself
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true } // Expiration date, 1 hour from creation
});

// Set up an automatic TTL index to delete expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', tokenSchema);
