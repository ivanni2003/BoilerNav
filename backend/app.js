/*
Should just import stuff from controllers, maybe other files depending on how other stuff is implemented.

*/


const express = require('express')
const app = express()
const testRouter = require('./controllers/testing')

const cors = require('cors')

app.use(cors());

app.use('/api/test', testRouter)

module.exports = app