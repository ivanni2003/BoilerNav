const wayRouter = require("express").Router();
const Way = require("../models/osmWay");
const NavNode = require("../models/navNode");
const NavWay = require("../models/navWay");

/* endpoints here */

// GET all ways
wayRouter.get("/", async (request, response) => {
  const ways = await Way.find({});
  response.json(ways);
});

// GET all ways that represent buildings
wayRouter.get("/buildings", async (request, response) => {
  const buildings = await Way.find({ "tags.building": { $exists: true } });
  response.json(buildings);
});

// GET parking lots that are buildings
wayRouter.get("/parkinglots", async (request, response) => {
  const parkingLots = await Way.find({ "tags.amenity": { $exists: true, $eq: "parking" } });
  response.json(parkingLots);
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

const getClosestNode = (nodes, lat, lon) => {
  // console.log(nodes.length);
  let closestNode = null;
  let closestDistance = Infinity;
  nodes.forEach((node) => {
    const distance = Math.sqrt(
      (node.latitude - lat) ** 2 + (node.longitude - lon) ** 2,
    );
    if (distance < closestDistance) {
      closestNode = node;
      closestDistance = distance;
    }
  });
  return closestNode;
};

const pathBetweenNodes = (startNode, endNode, nodes, ways) => {
  startNode.distance = 0;
  const unvisited = new Set(nodes);
  let iterations = 0;
  while (unvisited.size > 0) {
    iterations += 1;
    // Find the unvisited node with the smallest distance
    let current = null;
    let smallestDistance = Infinity;
    unvisited.forEach((node) => {
      if (node.id === startNode.id) {
        // console.log("Start node is still unvisited");
        // console.log("Start node distance: " + node.distance);
      }
      if (node.distance < smallestDistance) {
        current = node;
        smallestDistance = node.distance;
        // console.log("Current node: " + current.distance);
      }
    });
    if (current === null) {
      console.log("No current node found");
      console.log(iterations);
      return [];
    }
    unvisited.delete(current);
    if (current === endNode) {
      break;
    }
    const neighbors = [];
    current.ways.forEach((wayId) => {
      const way = ways.find((w) => w.id === wayId);
      // Find the index of the current node in the way
      const index = way.nodes.indexOf(current.id);
      if (index > 0) {
        neighbors.push(nodes.find((n) => n.id === way.nodes[index - 1]));
      }
      if (index < way.nodes.length - 1) {
        neighbors.push(nodes.find((n) => n.id === way.nodes[index + 1]));
      }
    });
    // console.log("Neighbors: " + neighbors.length);
    neighbors.forEach((neighbor) => {
      const distance =
        current.distance +
        Math.sqrt(
          (neighbor.latitude - current.latitude) ** 2 +
            (neighbor.longitude - current.longitude) ** 2,
        );
      // console.log("Distance: " + distance);
      // console.log("Neighbor distance: " + neighbor.distance);
      if (neighbor.distance === undefined) {
        neighbor.distance = Infinity;
      }
      if (distance < neighbor.distance) {
        neighbor.distance = distance;
        neighbor.previous = current;
        // console.log("New Neighbor distance: " + neighbor.distance);
      }
    });
  }
  const path = [];
  let current = endNode;
  while (current) {
    path.unshift(current);
    current = current.previous;
  }
  return path;
};

wayRouter.get(
  "/route/:startLat/:startLon/:endLat/:endLon",
  async (request, response) => {
    // Convert the start and end coordinates from strings to numbers
    let start = {};
    let end = {};
    try {
      start = {
        lat: parseFloat(request.params.startLat),
        lon: parseFloat(request.params.startLon),
      };
      end = {
        lat: parseFloat(request.params.endLat),
        lon: parseFloat(request.params.endLon),
      };
    } catch (error) {
      response.status(400).json({ error: "Invalid coordinates" });
      return;
    }
    const searchRadiusMeters = 1000;
    const searchRadiusDegrees = searchRadiusMeters / 111111;
    // navNode lat and lon are named latitude and longitude
    const closeStartNodes = await NavNode.find({
      latitude: {
        $gte: start.lat - searchRadiusDegrees,
        $lte: start.lat + searchRadiusDegrees,
      },
      longitude: {
        $gte: start.lon - searchRadiusDegrees,
        $lte: start.lon + searchRadiusDegrees,
      },
    });
    const closeEndNodes = await NavNode.find({
      latitude: {
        $gte: end.lat - searchRadiusDegrees,
        $lte: end.lat + searchRadiusDegrees,
      },
      longitude: {
        $gte: end.lon - searchRadiusDegrees,
        $lte: end.lon + searchRadiusDegrees,
      },
    });
    const nodes = await NavNode.find({});
    const ways = await NavWay.find({});
    let startNode = getClosestNode(closeStartNodes, start.lat, start.lon);
    let endNode = getClosestNode(closeEndNodes, end.lat, end.lon);
    if (startNode === null || endNode === null) {
      let error = "Could not find nodes near given coordinates";
      if (startNode === null) {
        error += " (start)";
      }
      if (endNode === null) {
        error += " (end)";
      }
      response.status(400).json({ error: error });
      return;
    }
    // Start and end nodes need to be pointers to the nodes in the nodes array
    startNode = nodes.find((node) => node.id === startNode.id);
    endNode = nodes.find((node) => node.id === endNode.id);
    console.log("Start node:");
    console.log(startNode);
    console.log("End node:");
    console.log(endNode);
    const path = pathBetweenNodes(startNode, endNode, nodes, ways);
    response.json(path);
  },
);

wayRouter.get("/buildings", async (request, response) => {
  try {
    const buildings = await Way.find({ "tags.building": { $exists: true } });
    const buildingsWithFloorPlans = await Promise.all(
      buildings.map(async (building) => {
        const floorPlans = await FloorPlan.find({ buildingId: building.id });
        return { ...building.toObject(), floorPlans: floorPlans };
      }),
    );
    response.json(buildingsWithFloorPlans);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

module.exports = wayRouter;
