const navigationRouter = require("express").Router();
const { findShortestPath } = require('../findPath'); // Import pathfinding utility
const nodesData = require('../Node0.geojson');

navigationRouter.get('/path', async (req, res) => {
    const { start, end } = req.query;
  
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end nodes are required" });
    }
  
    try {
      // Call the pathfinding function (implement this in a separate utility file)
      const { route, distance } = findShortestPath(nodesData, start, end);
  
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
module.exports = navigationRouter;
