const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  major: String,
  affiliation: String,
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique:true, required: true },
  // Add any other fields you want to store
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    // the passwordHash should not be revealed
    delete returnedObject.password;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;