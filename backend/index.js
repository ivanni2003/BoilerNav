const app = require("./app");
require("dotenv").config();
const saveData = require("./fetchOverpassData"); // for fetching osm data
const updateBuildingPositions = require("./updateBuildingPositions");
// const populateNavObjects = require("./populateNavObjects");

/* Note: this is the file ran when npm run dev is typed, this file imports
everything from app, hierarchy is index->app->...
*/

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    // await saveData(); // Leave commented out, don't want to fetch every time
    // await updateBuildingPositions(); // Leave commented out
    // await popuzlateNavObjects(); // Leave commented out
  } catch (exception) {
    console.error("Fetch Data Error:" + exception);
  }
});
