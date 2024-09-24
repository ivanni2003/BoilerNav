/*
Controllers folder should have files implementing communication between client-server-db. 
*/

const testRouter = require('express').Router()

let testData = [
    {
      id: 1, name: "Ivan",
    },
    {
      id: 2, name: "Roman",
    },
    {
      id: 3, name: "Nate"
    },
    {
      id: 4, name: "Hunter"
    },
    {
      id: 5, name: "Jacob"
    }
  ]
  
  
  testRouter.get('/', (request, response) => {
    response.json(testData)
  })
  
  testRouter.get('/:id', (request, response) => {
    const id = request.params.id
    const testUser = testData.find(testUser => testUser.id == id)
    response.json(testUser)
  })

  module.exports = testRouter