const mongoose = require('mongoose');

const navNodeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    // I'm not entirely sure what "ways" is supposed to do.
    ways: [{ type: Number }],
});

module.exports = mongoose.model('NavNode', navNodeSchema)