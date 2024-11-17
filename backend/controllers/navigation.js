const path = require("path");
const fs = require("fs");
const navigationRouter = require("express").Router();
const { findPath, latLonToXY }  = require('../IndoorNav'); // Import pathfinding utility
const IndoorData = require('../models/indoorData');

navigationRouter.get('/path', async (req, res) => {
    const { building, start, end } = req.query;
    if (!building || !start || !end) {
      return res.status(400).json({ message: "Building and Start and end nodes are required" });
    }
    console.log(building);
    if (start == -100 && end == -100) {
      return res.json({ route: null, distance: 0 });
    }
  
    try {
      // Call the pathfinding function (implement this in a separate utility file)
      const { route, distance } = await findPath("./Node0.geojson", start, end);
      //console.log(route);
  
      if (route) {
        res.json({ route, distance }); // Send back the route array for frontend rendering
      } else {
        res.status(404).json({ message: "No path found" });
      }
    } catch (error) {
      console.error("Error finding path:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });  
  
  async function getRoomPosition(name) {
    // Nate note: Single source-of-truth is in MongoDB now.
    /*
    // Load GeoJSON data once to use it across requests
    const geoJsonPath = path.join(__dirname, "../Node0.geojson");
    const data = await fs.promises.readFile(geoJsonPath, "utf8");
    const features = JSON.parse(data).features;

    // Find the room by name
    const room = features.find(feature => feature.properties.RoomName === name);
    if (!room) return null;

    const { coordinates: [lon, lat] } = room.geometry;
    return latLonToXY(lat, lon);
    */
    try {
      // Fetch the room from the database
      const room = await IndoorData.findOne({ 'features.properties.RoomName': name }, { 'features.$': 1 });
      if (!room || !room.features || room.features.length === 0) {
        return null;
      }
  
      const feature = room.features[0];
      const { coordinates } = feature.geometry;
      const [lon, lat] = coordinates;
  
      return latLonToXY(lat, lon);
    } catch (error) {
      console.error('Error fetching room position from database:', error);
      throw error;
    }
}

navigationRouter.get('/position-from-name', async(req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }

  try {
    const position = await getRoomPosition(name);
    if (position) {
      res.json(position);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    console.error("Error finding position:", error);
    res.status(500).json({ message: "Internal server error" });
  }
})

/*
// Load GeoJSON data from file (can reuse if already implemented in IndoorNav.js)
async function loadGeoJSON(path) {
  const data = await fs.promises.readFile(path, "utf8");
  return JSON.parse(data).features;
}

// New function to get nodes on a specific floor
async function getNodesByFloor(floor) {
  const geoJsonPath = path.join(__dirname, "../Node0.geojson"); // Adjust path if necessary
  const features = await loadGeoJSON(geoJsonPath);

  // Filter nodes by floor
  const nodesOnFloor = features.filter(feature => feature.properties.Floor === Number(floor));

  return nodesOnFloor;
}
*/

async function getNodesByFloor(buildingName, floor) {
  try {
    const indoorData = await IndoorData.findOne({ name: buildingName });
    if (!indoorData) {
      return [];
    }

    // Filter nodes by floor
    const nodesOnFloor = indoorData.features.filter(feature => feature.properties.Floor === Number(floor));

    return nodesOnFloor;
  } catch (error) {
    console.error('Error fetching nodes by floor from database:', error);
    throw error;
  }
}

navigationRouter.get('/get-floor-nodes', async (req, res) => {
  const { floor } = req.query;

  if (floor === undefined) {
    return res.status(400).json({ message: "floor param needed." });
  }

  try {
    const nodes = await getNodesByFloor("LawsonHall(LWSN)", floor);
    res.json(nodes);
  } catch (error) {
    console.error("Error fetching nodes by floor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
})

module.exports = navigationRouter;
