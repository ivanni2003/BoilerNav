/*
Mainly for importing stuff from other files/folders
*/

const express = require('express')
const mongoose = require('mongoose')
const app = express()
const testRouter = require('./controllers/testing')
const usersRouter = require('./controllers/users')

const url = 'mongodb+srv://boilernav123:team13@boilernav.93a2g.mongodb.net/?retryWrites=true&w=majority&appName=BoilerNav'
const cors = require('cors')

mongoose.set('strictQuery',false)
mongoose.connect(url)       

app.use(cors());   // middleware to connect front & back
app.use(express.json());    // ensures data sent in json

app.use('/api/test', testRouter) // for testing
app.use('/api/users', usersRouter)

module.exports = app