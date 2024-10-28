const navWayRouter = require("express").Router();
const NavWay = require("../models/navWay");

/* endpoints here */

// GET all ways
navWayRouter.get("/", async (request, response) => {
  const ways = await NavWay.find({});
  response.json(ways);
});

// GET ways by  _id in the database
navWayRouter.get("/id/DBID/:_ids", async (request, response) => {
  // There may be multiple ids separated by commas
  // Get a list of strings (database ids are strings)
  const ids = request.params._ids.split(",");
  const ways = await NavWay.find({ _id: { $in: ids } });
  response.json(ways);
});

// GET ways by id
navWayRouter.get("/id/:ids", async (request, response) => {
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
  const ways = await NavWay.find({ id: { $in: ids } });
  response.json(ways);
});

module.exports = navWayRouter;
