const relationRouter = require("express").Router();
const Relation = require("../models/osm_relation");

/* endpoints here */

// GET all relations
relationRouter.get("/", async (request, response) => {
  const relations = await Relation.find({});
  response.json(relations);
});

// GET relations by _id in the database
relationRouter.get("/id/DBID/:_ids", async (request, response) => {
  // There may be multiple ids separated by commas
  // Get a list of strings (database ids are strings)
  const ids = request.params._ids.split(",");
  const relations = await Relation.find({ _id: { $in: ids } });
  response.json(relations);
});

// GET relations by id
relationRouter.get("/id/:ids", async (request, response) => {
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
  const relations = await Relation.find({ id: { $in: ids } });
  response.json(relations);
});

module.exports = relationRouter;
