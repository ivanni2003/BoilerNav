const app = require('./app')

/*
How to run:
1) ensure you are in backend directory
2) type npm run dev in terminal
3) open localhost 3001 (we don't really use this, it's just to ensure that backend works)
*/

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})