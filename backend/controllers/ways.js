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
  const parkingLots = await Way.find({
    "tags.amenity": { $exists: true, $eq: "parking" },
  });
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

const waysBetweenNodes = (startNode, endNode, nodes, ways) => {
  if (startNode === null || endNode === null) {
    return [];
  }
  if (startNode.ways.length === 0 || endNode.ways.length === 0) {
    return [];
  }
  // If startNode has more than one way, it is an intersection, and the
  // distance each way is 0 And each of the node's way can be added to the
  // way queue Else, need to measure the distance between start node and the
  // ends of its way And add the connected ways to the way queue
  let wayQueue = [];
  let endWays = [];
  if (startNode.ways.length > 1) {
    // Convert way ids to way objects from the passed ways array
    wayQueue = startNode.ways.map((wayId) => {
      const way = ways.find((way) => way.id === wayId);
      way.distance = 0;
      way.previous = null;
      return way;
    });
  } else {
    const startWay = ways.find((way) => way.id === startNode.ways[0]);
    startWay.distance = 0;
    startWay.previous = null;
    const connectedWays = startWay.connectedWays.map((wayId) =>
      ways.find((way) => way.id === wayId),
    );
    // const startWayNodes = startWay.nodes.map((nodeId) =>
    // nodes.find((node) => node.id === nodeId)); Find which connected way
    // is connected to which end of the start way
    const startWayEndNode1 = startWayNodes[0];
    const startWayEndNode2 = startWayNodes[startWayNodes.length - 1];
    const EndNodeDistance1 = Math.sqrt(
      ((startWayEndNode1.latitude - endNode.latitude) * 111111) ** 2 +
        ((startWayEndNode1.longitude - endNode.longitude) * 111111) ** 2,
    );
    const EndNodeDistance2 = startWay.length - EndNodeDistance1;
    connectedWays.forEach((way) => {
      const wayNodeEndNodeID1 = way.nodes[0];
      const wayNodeEndNodeID2 = way.nodes[way.nodes.length - 1];
      if (
        wayNodeEndNodeID1 === startWayEndNode1.id ||
        wayNodeEndNodeID2 === startWayEndNode1.id
      ) {
        way.distance = EndNodeDistance1;
        way.previous = startWay;
        wayQueue.push(way);
      } else if (
        wayNodeEndNodeID1 === startWayEndNode2.id ||
        wayNodeEndNodeID2 === startWayEndNode2.id
      ) {
        way.distance = EndNodeDistance2;
        way.previous = startWay;
        wayQueue.push(way);
      } else {
        console.error("Connected way not connected to start way");
      }
    });
  }
};

const pathBetweenNodes = (startNode, endNode, nodes, ways) => {
  startNode.distance = 0;
  const unvisited = new Set();
  // Add the start node to the unvisited set
  unvisited.add(startNode);
  startNode.previous = null;
  startNode.distance = 0;
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

      // Check if way existes otherwise just skip it.
      if (!way) {
        console.error(`Way with id ${wayId} not found`);
        return;
      }

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
        unvisited.add(neighbor);
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
    const searchRadiusMeters = 100;
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

wayRouter.get(
  "/bike-route/:startLat/:startLon/:endLat/:endLon",
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
    const bikeWays = await NavWay.find({
      type: {
        $in: [
          "cycleway",
          "bicycle",
          "shared_lane",
          "lane",
          "track",
          "path",
          "footway",
          "footpath",
          "bridleway",
          "living_street",
          "residential",
          "service",
          "unclassified",
          "tertiary",
          "secondary",
          "primary",
        ],
      },
    });
    console.log("# of bike ways: " + bikeWays.length);
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
    console.log("Start Bike node:", startNode);
    console.log("End Bike node:", endNode);
    const path = pathBetweenNodes(startNode, endNode, nodes, bikeWays);
    response.json(path);
  },
);

wayRouter.get(
  "/bus-route/:startLat/:startLon/:endLat/:endLon",
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
    const busWays = await NavWay.find({
      type: {
        $in: [
          "motorway",
          "trunk",
          "primary",
          "secondary",
          "tertiary",
          "unclassified",
          "residential",
          "service",
          "living_street",
          "footpath",
        ],
      },
    });
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
    console.log("Start Bus node:", startNode);
    console.log("End Bus node:", endNode);
    const path = pathBetweenNodes(startNode, endNode, nodes, busWays);

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
