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
  return nodes.reduce(
    (closest, node) => {
      const distance = Math.sqrt((node.lat - lat) ** 2 + (node.lon - lon) ** 2);
      if (distance < closest.distance) {
        return { node, distance };
      }
      return closest;
    },
    { node: null, distance: Infinity },
  ).node;
};

const pathBetweenNodes = (startNode, endNode, nodes, ways) => {
  startNode.distance = 0;
  const unvisited = new Set(nodes);
  while (unvisited.size > 0) {
    const current = [...unvisited].reduce((minNode, node) => {
      if (node.distance < minNode.distance) {
        return node;
      }
      return minNode;
    });
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
    neighbors.forEach((neighbor) => {
      const distance =
        current.distance +
        Math.sqrt(
          (neighbor.lat - current.lat) ** 2 + (neighbor.lon - current.lon) ** 2,
        );
      if (distance < neighbor.distance) {
        neighbor.distance = distance;
        neighbor.previous = current;
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
    const start = {
      lat: request.params.startLat,
      lon: request.params.startLon,
    };
    const end = { lat: request.params.endLat, lon: request.params.endLon };
    const searchRadiusMeters = 50;
    const searchRadiusDegrees = searchRadiusMeters / 111111;
    const closeStartNodes = await NavNode.find({
      lat: {
        $gte: start.lat - searchRadiusDegrees,
        $lte: start.lat + searchRadiusDegrees,
      },
      lon: {
        $gte: start.lon - searchRadiusDegrees,
        $lte: start.lon + searchRadiusDegrees,
      },
    });
    const closeEndNodes = await NavNode.find({
      lat: {
        $gte: end.lat - searchRadiusDegrees,
        $lte: end.lat + searchRadiusDegrees,
      },
      lon: {
        $gte: end.lon - searchRadiusDegrees,
        $lte: end.lon + searchRadiusDegrees,
      },
    });
    const nodes = await NavNode.find({});
    const ways = await NavWay.find({});
    const startNode = getClosestNode(closeStartNodes, start.lat, start.lon);
    const endNode = getClosestNode(closeEndNodes, end.lat, end.lon);
    const path = pathBetweenNodes(startNode, endNode, nodes, ways);
    response.json(path);
  },
);

module.exports = wayRouter;
