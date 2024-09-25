/*
Controllers folder can have files implementing communication between client-server-db. 
*/

// This is testing file

const testRouter = require('express').Router()
const Test = require('../models/test')  // takes data format from models/test.js


  testRouter.get('/', async (request, response) => { // get all test data from db
    const testData = await Test.find({})
    response.json(testData)
  })
  
  testRouter.post('/', async (request, response) => {  // save new test data to db
    const body = request.body
    const test =  new Test ({ name: body.name })

    const savedTest = await test.save()

    response.json(savedTest)
  })

  testRouter.delete('/:id', (request, response) => {
    Test.findByIdAndDelete(request.params.id).then(result => {
      response.json(204).end()
    })
  })
  module.exports = testRouter