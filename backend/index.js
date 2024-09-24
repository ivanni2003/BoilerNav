/*
How to run:
1) ensure you are in backend directory
2) type npm run dev in terminal
3) open localhost 3001 (we don't really use this, it's just to ensure that backend works)
*/


const express = require('express')
const app = express()

app.get('/', (request, response) => {
    response.end("<p>BoilerNav Backend</p>")
  })

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})