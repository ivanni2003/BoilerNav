const relationRouter = require("express").Router();
const Relation = require("../models/osm_relation");

/* endpoints here */

// GET all relations
relationRouter.get("/", async (request, response) => {
  const relations = await Relation.find({});
  response.json(relations);
});

// GET a relation by its _id in the database
relationRouter.get("/id/DBID/:_id", async (request, response) => {
  const relation = await Relation.findById(request.params._id);
  response.json(relation);
});

// GET a relation by id
relationRouter.get("/id/:id", async (request, response) => {
  // Use the id field, not _id
  const relation = await Relation.findOne({ id: request.params.id });
  response.json(relation);
});

module.exports = relationRouter;
