const nodeRouter = require("express").Router();
const Node = require("../models/osm_node");

/* endpoints here */

// GET all nodes
nodeRouter.get("/", async (request, response) => {
  const nodes = await Node.find({});
  response.json(nodes);
});

// GET a node by its _id in the database
nodeRouter.get("/id/:_id", async (request, response) => {
  const node = await Node.findById(request.params._id);
  response.json(node);
});

// GET a node by id
nodeRouter.get("/:id", async (request, response) => {
  // Use the id field, not _id
  const node = await Node.findOne({ id: request.params.id });
  response.json(node);
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
module.exports = nodeRouter;
