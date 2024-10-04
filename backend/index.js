const app = require('./app')
require('dotenv').config();
const saveData = require('./fetchOverpassData') // for fetching osm data

/* Note: this is the file ran when npm run dev is typed, this file imports everyting
from app, hierachy is index->app->...
*/

const PORT = 3001
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`)

    try {
        //await saveData(); //Leave commented out, don't want to fetch every time backend in run
      } catch (exception) {
        console.error('Fetch Data Error:' + exception);
      }
})

