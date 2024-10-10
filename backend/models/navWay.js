const mongoose = require('mongoose');
const NavNode = require('./navNode')

const navWaySchema = new mongoose.Schema({
    nodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NavNode' }],
    length: { type: Number },
    type: { type: String, default: 'footpath' },
});

module.exports = mongoose.model('NavWay', navWaySchema)