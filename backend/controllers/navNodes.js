const navNodeRouter = require("express").Router();
const NavNode = require("../models/navNode");

// DEBUG: For reading the nodeGraph.json file
const fs = require("fs");

/* endpoints here */

// GET all nodes
navNodeRouter.get("/", async (request, response) => {
  const nodes = await NavNode.find({});
  response.json(nodes);
});

// GET nodes by its _id in the database
navNodeRouter.get("/id/DBID/:_ids", async (request, response) => {
  // There may be multiple ids separated by commas
  // Get a list of strings (database ids are strings)
  const ids = request.params._ids.split(",");
  const nodes = await NavNode.find({ _id: { $in: ids } });
  response.json(nodes);
});

// GET nodes by id
navNodeRouter.get("/id/:ids", async (request, response) => {
  // Use the id field, not _id
  // Ids are numbers, so we need to convert the strings to numbers (which may
  // fail)
  const ids = request.params.ids.split(",").map((id) => {
    try {
      return parseInt(id);
    } catch (error) {
      return null;
    }
  });
  const nodes = await NavNode.find({ id: { $in: ids } });
  response.json(nodes);
});

// GET all nodes within a bounding box using their lat and lon fields
navNodeRouter.get(
  "/bbox/:minLat/:minLon/:maxLat/:maxLon",
  async (request, response) => {
    const nodes = await NavNode.find({
      lat: { $gte: request.params.minLat, $lte: request.params.maxLat },
      lon: { $gte: request.params.minLon, $lte: request.params.maxLon },
    });
    response.json(nodes);
  },
);

// DEBUG: GET the nodes in nodeGraph.json
navNodeRouter.get("/nodeGraph", async (request, response) => {
  const nodes = JSON.parse(fs.readFileSync("nodeGraph.json"));
  response.json(nodes);
});

module.exports = navNodeRouter;
