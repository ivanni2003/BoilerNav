const express = require('express')
const app = express()

app.get('/', (request, response) => {
    response.end("<p>BoilerNav Backend</p>")
  })

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})