const app = require('./app')
const saveData = require('./fetchOverpassData')

/* Note: this is the file ran when npm run dev is typed, this file imports everyting
from app, hierachy is index->app->...
*/

const PORT = 3001
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`)

    try {
        await saveData(); // Call the function to fetch and save data
      } catch (exception) {
        console.error('Fetch Data Error:' + exception);
      }
})

