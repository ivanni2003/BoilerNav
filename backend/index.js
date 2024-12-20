const app = require("./app");
require("dotenv").config();
const saveData = require("./fetchOverpassData"); // for fetching osm data
const updateBuildingPositions = require("./updateBuildingPositions");
const preprocessNavWays = require("./preprocessNavWays");

/* Note: this is the file ran when npm run dev is typed, this file imports
everything from app, hierarchy is index->app->...
*/

const PORT = process.env.PORT;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    // await saveData(); // Leave commented out, don't want to fetch every time
    // await updateBuildingPositions(); // Leave commented out
    // await preprocessNavWays(); // Leave commented out
  } catch (exception) {
    console.error("Fetch Data Error:" + exception);
  }
});
