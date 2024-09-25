const app = require('./app')

/* Note: this is the file ran when npm run dev is typed, this file imports everyting
from app, hierachy is index->app->...
*/

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})