const wayRouter = require("express").Router();
const Way = require("../models/osm_way");

/* endpoints here */

// GET all ways
wayRouter.get("/", async (request, response) => {
  const ways = await Way.find({});
  response.json(ways);
});

// GET a way by its _id in the database
wayRouter.get("/id/DBID/:_id", async (request, response) => {
  const way = await Way.findById(request.params._id);
  response.json(way);
});

// GET a way by id
wayRouter.get("/id/:id", async (request, response) => {
  // Use the id field, not _id
  const way = await Way.findOne({ id: request.params.id });
  response.json(way);
});

module.exports = wayRouter;
