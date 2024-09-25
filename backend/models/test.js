/*
Models folder can have files specifying format (schema) of data sent to database.
*/

// This is testing file

const mongoose = require('mongoose')

const testSchema = new mongoose.Schema({   // format of data sent to db
    name: String
})

testSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString(); // Convert _id to id
        delete returnedObject._id; // Remove _id
        delete returnedObject.__v; // Remove __v
    }
});

module.exports = mongoose.model('Test', testSchema)