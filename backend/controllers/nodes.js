const nodeRouter = require("express").Router();
const Node = require("../models/osm_node");

/* endpoints here */

// GET all nodes
nodeRouter.get("/", async (request, response) => {
  const nodes = await Node.find({});
  response.json(nodes);
});

// GET nodes by its _id in the database
nodeRouter.get("/id/DBID/:_ids", async (request, response) => {
  // There may be multiple ids separated by commas
  // Get a list of strings (database ids are strings)
  const ids = request.params._ids.split(",");
  const nodes = await Node.find({ _id: { $in: ids } });
  response.json(nodes);
});

// GET nodes by id
nodeRouter.get("/id/:ids", async (request, response) => {
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
  const nodes = await Node.find({ id: { $in: ids } });
  response.json(nodes);
});

// GET all nodes within a bounding box using their lat and lon fields
nodeRouter.get(
  "/bbox/:minLat/:minLon/:maxLat/:maxLon",
  async (request, response) => {
    const nodes = await Node.find({
      lat: { $gte: request.params.minLat, $lte: request.params.maxLat },
      lon: { $gte: request.params.minLon, $lte: request.params.maxLon },
    });
    response.json(nodes);
  },
);

// GET all nodes within a bounding box and that match a given type
nodeRouter.get(
  "/bbox/:minLat/:minLon/:maxLat/:maxLon/:type",
  async (request, response) => {
    const nodes = await Node.find({
      lat: { $gte: request.params.minLat, $lte: request.params.maxLat },
      lon: { $gte: request.params.minLon, $lte: request.params.maxLon },
      type: request.params.type,
    });
    response.json(nodes);
  },
);

module.exports = nodeRouter;
