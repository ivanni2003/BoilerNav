const path = require("path");
const fs = require("fs");
const navigationRouter = require("express").Router();
const { findPath } = require("../IndoorNav"); // Import pathfinding utility
const IndoorData = require("../models/indoorNav");

navigationRouter.get("/path", async (req, res) => {
  const { building, start, end } = req.query;
  if (!building || !start || !end) {
    return res
      .status(400)
      .json({ message: "Building and Start and end nodes are required" });
  }
  console.log(building);
  if (start == -100 && end == -100) {
    return res.json({ route: null, distance: 0 });
  }

  try {
    // Fetch building data from database
    const indoorData = await IndoorData.findOne({ name: building });
    if (!indoorData) {
      return res.status(404).json({ message: "Building not found" });
    }

    // Call the pathfinding function (implement this in a separate utility file)
    const { route, distance } = await findPath(indoorData, start, end);
    // console.log(route);

    if (route) {
      res.json({
        route,
        distance,
      }); // Send back the route array for frontend rendering
    } else {
      res.status(404).json({ message: "No path found" });
    }
  } catch (error) {
    console.error("Error finding path:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

async function getRoomPosition(buildingName, roomName) {
  // Load GeoJSON data once to use it across requests
  // const geoJsonPath = path.join(__dirname, "../Node0.geojson");
  // const data = await fs.promises.readFile(geoJsonPath, "utf8");
  // const features = JSON.parse(data).features;

  const indoorData = await IndoorData.findOne({ name: name });
  if (!indoorData) {
    return null;
  }
  const features = indoorData.features;

  // Find the room by name
  const room = features.find((feature) => feature.properties.RoomName === name);
  if (!room) return null;

  return room.geometry;
}

navigationRouter.get("/position-from-name", async (req, res) => {
  const { buildingName, roomName } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }

  try {
    const position = await getRoomPosition(buildingName, roomName);
    if (position) {
      res.json(position);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    console.error("Error finding position:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// New function to get nodes on a specific floor
async function getNodesByFloor(buildingName, floorNumber) {
  // const geoJsonPath = path.join(__dirname, "../Node0.geojson"); // Adjust
  // path if necessary const features = await loadGeoJSON(geoJsonPath);

  const indoorData = await IndoorData.findOne({ name: buildingName });
  if (!indoorData) {
    return null;
  }
  const features = indoorData.features;

  // Filter nodes by floor
  const nodesOnFloor = features.filter(
    (feature) => feature.properties.Floor === floorNumber,
  );

  return nodesOnFloor;
}

navigationRouter.get("/get-floor-nodes", async (req, res) => {
  const { buildingName, floor } = req.query;

  if (floor === undefined) {
    return res.status(400).json({ message: "floor param needed." });
  }

  try {
    const nodes = await getNodesByFloor(buildingName, floor);
    res.json(nodes);
  } catch (error) {
    console.error("Error fetching nodes by floor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = navigationRouter;
