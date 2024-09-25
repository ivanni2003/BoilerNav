/*
Mainly for importing stuff from other files/folders
*/

const express = require('express')
const mongoose = require('mongoose')
const app = express()
const testRouter = require('./controllers/testing')

const url = 'mongodb+srv://boilerNav123:team13@boilernav.sfmj3.mongodb.net/?retryWrites=true&w=majority&appName=BoilerNav'
const cors = require('cors')

mongoose.set('strictQuery',false)
mongoose.connect(url)       

app.use(cors());   // middleware to connect front & back
app.use(express.json());    // ensures data sent in json

app.use('/api/test', testRouter) // for testing

module.exports = app