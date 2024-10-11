const wayRouter = require("express").Router();
const Way = require("../models/osmWay");

/* endpoints here */

// GET all ways
wayRouter.get("/", async (request, response) => {
  const ways = await Way.find({});
  response.json(ways);
});

// GET all ways that represent buildings
wayRouter.get("/buildings", async (request, response) => {
  const buildings = await Way.find({ "tags.building": {$exists: true} });
  response.json(buildings);
});

// GET ways by  _id in the database
wayRouter.get("/id/DBID/:_ids", async (request, response) => {
  // There may be multiple ids separated by commas
  // Get a list of strings (database ids are strings)
  const ids = request.params._ids.split(",");
  const ways = await Way.find({ _id: { $in: ids } });
  response.json(ways);
});

// GET ways by id
wayRouter.get("/id/:ids", async (request, response) => {
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
  const ways = await Way.find({ id: { $in: ids } });
  response.json(ways);
});

wayRouter.get("/buildings", async (request, response) => {
  try {
    const buildings = await Way.find({ "tags.building": {$exists: true} });
    const buildingsWithFloorPlans = await Promise.all(buildings.map(async (building) => {
      const floorPlans = await FloorPlan.find({ buildingId: building.id });
      return {
        ...building.toObject(),
        floorPlans: floorPlans
      };
    }));
    response.json(buildingsWithFloorPlans);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

module.exports = wayRouter;
