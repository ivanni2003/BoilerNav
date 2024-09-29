/*
Mainly for importing stuff from other files/folders
*/

const express = require('express')
const mongoose = require('mongoose')
const app = express()
const testRouter = require('./controllers/testing')
const nodeRouter = require('./controllers/nodes')
const relationRouter = require('./controllers/relations')
const wayRouter = require('./controllers/ways')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const resetPasswordRouter = require('./controllers/resetPassword')

const url = 'mongodb+srv://boilernav123:team13@boilernav.93a2g.mongodb.net/?retryWrites=true&w=majority&appName=BoilerNav'
const cors = require('cors')

mongoose.set('strictQuery',false)
mongoose.connect(url)       

app.use(cors());   // middleware to connect front & back
app.use(express.json());    // ensures data sent in json

app.use('/api/test', testRouter) // for testing
app.use('/api/nodes', nodeRouter)
app.use('/api/relations', relationRouter)
app.use('/api/wayRouter', wayRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/reset-password', resetPasswordRouter)

module.exports = app