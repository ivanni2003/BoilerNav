const wayRouter = require("express").Router();
const NavNode = require("../models/navNode");
const NavWay = require("../models/navWay");
<<<<<<< HEAD
const OsmNode = require("../models/osmNode");
=======
const Node = require("../models/osmNode");
>>>>>>> 88c670c210519571430dfd51b0df0c2d4c0402a3
const Way = require("../models/osmWay");

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

wayRouter.get("/bikeracks", async (request, response) => {
  const bikeRacksWays = await Way.find({
    $or: [
      { "tags.amenity": "bicycle_parking" },
      { "tags.bicycle_parking": { $exists: true } },
    ],
  });
<<<<<<< HEAD
  const bikeRacksNodes = await OsmNode.find({
=======
  const bikeRacksNodes = await Node.find({
>>>>>>> 88c670c210519571430dfd51b0df0c2d4c0402a3
    $or: [
      { "tags.amenity": "bicycle_parking" },
      { "tags.bicycle_parking": { $exists: true } },
    ],
  });
  const bikeRacks = bikeRacksWays.concat(bikeRacksNodes);
  response.json(bikeRacks);
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

const pathBetweenWays = (startNode, endNode, nodes, ways) => {
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
    const startWayNodes = startWay.nodes.map((nodeId) =>
      nodes.find((node) => node.id === nodeId),
    );
    // Find which connected way is connected to which end of the start way
    const startWayEndNode1 = startWayNodes[0];
    const startWayEndNode2 = startWayNodes[startWayNodes.length - 1];
    const EndNodeDistance1 = Math.sqrt(
      ((startWayEndNode1.latitude - startNode.latitude) * 111111) ** 2 +
        ((startWayEndNode1.longitude - startNode.longitude) *
          111111 *
          Math.cos(startNode.latitude)) **
          2,
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
  // Add endNode's ways to the endWays array
  endNode.ways.forEach((wayId) => {
    endWays.push(wayId);
  });
  let finalWay = null;
  while (wayQueue.length > 0) {
    const currentWay = wayQueue.shift();
    if (endWays.includes(currentWay.id)) {
      // Found the end way
      finalWay = currentWay;
      break;
    }
    // Add connected ways to the way queue
    currentWay.connectedWays.forEach((wayId) => {
      const way = ways.find((w) => w.id === wayId);
      if (!way) {
        console.error("Connected way not found");
        return;
      }
      if (
        way.distance === undefined ||
        way.distance > currentWay.distance + way.length
      ) {
        way.distance = currentWay.distance + way.length;
        way.previous = currentWay;
        wayQueue.push(way);
      }
    });
  }
  if (finalWay === null) {
    return [];
  }
  if (finalWay.previous === null) {
    // Route only exists in one way
    // TODO
    return [];
  }
  let currentWay = finalWay;
  const wayPath = [];
  while (currentWay) {
    wayPath.unshift(currentWay);
    currentWay = currentWay.previous;
  }
  // For the first way, may start in the middle of it, so needs to be pathed
  // individually
  const firstWay = wayPath[0];
  let secondWay = wayPath[1];
  const firstWayEndNodeID1 = firstWay.nodes[0];
  const firstWayEndNodeID2 = firstWay.nodes[firstWay.nodes.length - 1];
  const secondWayEndNodeID1 = secondWay.nodes[0];
  const secondWayEndNodeID2 = secondWay.nodes[secondWay.nodes.length - 1];
  let routeReversed = false;
  if (
    firstWayEndNodeID1 === secondWayEndNodeID1 ||
    firstWayEndNodeID1 === secondWayEndNodeID2
  ) {
    // The route starts at startNode and travels against the way direction
    routeReversed = true;
  } else if (
    firstWayEndNodeID2 === secondWayEndNodeID1 ||
    firstWayEndNodeID2 === secondWayEndNodeID2
  ) {
    // The route starts at startNode and travels with the way direction
    routeReversed = false;
  } else {
    console.error("Connecting node not found in first way");
    return [];
  }
  const path = [];
  if (routeReversed) {
    // Start at the end of the first way and find the startNode
    let i = firstWay.nodes.length - 1;
    while (firstWay.nodes[i] !== startNode.id && i > -1) {
      i -= 1;
    }
    if (i === -1) {
      console.error("Start node not found in first way");
      return [];
    }
    for (let j = i; j >= 0; j--) {
      path.push(nodes.find((node) => node.id === firstWay.nodes[j]));
    }
  } else {
    // Start at the start of the first way and find the startNode
    let i = 0;
    while (firstWay.nodes[i] !== startNode.id && i < firstWay.nodes.length) {
      i += 1;
    }
    if (i === firstWay.nodes.length) {
      console.error("Start node not found in first way");
      return [];
    }
    for (let j = i; j < firstWay.nodes.length; j++) {
      path.push(nodes.find((node) => node.id === firstWay.nodes[j]));
    }
  }
  let finalConnectingNodeID = null;
  // Do the same thing for the rest of the ways
  // (Except now routing definitely doesn't start in the middle of a way)
  for (let i = 1; i < wayPath.length - 1; i++) {
    const currentWay = wayPath[i];
    const nextWay = wayPath[i + 1];
    const currentWayEndNodeID1 = currentWay.nodes[0];
    const currentWayEndNodeID2 = currentWay.nodes[currentWay.nodes.length - 1];
    const nextWayEndNodeID1 = nextWay.nodes[0];
    const nextWayEndNodeID2 = nextWay.nodes[nextWay.nodes.length - 1];
    let routeReversed = false;
    if (
      currentWayEndNodeID1 === nextWayEndNodeID1 ||
      currentWayEndNodeID1 === nextWayEndNodeID2
    ) {
      // The route starts at startNode and travels against the way direction
      routeReversed = true;
      finalConnectingNodeID = currentWayEndNodeID1;
    } else if (
      currentWayEndNodeID2 === nextWayEndNodeID1 ||
      currentWayEndNodeID2 === nextWayEndNodeID2
    ) {
      // The route starts at startNode and travels with the way direction
      routeReversed = false;
      finalConnectingNodeID = currentWayEndNodeID2;
    } else {
      console.error("Connecting node not found");
      return [];
    }
    if (routeReversed) {
      // Start at the end of the current way
      for (let j = currentWay.nodes.length - 1; j >= 0; j--) {
        path.push(nodes.find((node) => node.id === currentWay.nodes[j]));
      }
    } else {
      // Start at the start of the current way
      for (let j = 0; j < currentWay.nodes.length; j++) {
        path.push(nodes.find((node) => node.id === currentWay.nodes[j]));
      }
    }
  }
  // Now add the final way, which may end in the middle of it
  const finalWayEndNodeID1 = finalWay.nodes[0];
  const finalWayEndNodeID2 = finalWay.nodes[finalWay.nodes.length - 1];
  if (finalWayEndNodeID1 === finalConnectingNodeID) {
    // The route travels with the way direction
    routeReversed = false;
  } else if (finalWayEndNodeID2 === finalConnectingNodeID) {
    // The route travels against the way direction
    routeReversed = true;
  } else {
    console.error("Connecting node not found in final way");
    return [];
  }
  if (routeReversed) {
    // Start at the end of the final way and find the endNode
    let i = finalWay.nodes.length - 1;
    while (finalWay.nodes[i] !== endNode.id && i > -1) {
      path.push(nodes.find((node) => node.id === finalWay.nodes[i]));
      i -= 1;
    }
    if (i === -1) {
      console.error("End node not found in final way");
      return [];
    }
  } else {
    // Start at the start of the final way and find the endNode
    let i = 0;
    while (finalWay.nodes[i] !== endNode.id && i < finalWay.nodes.length) {
      path.push(nodes.find((node) => node.id === finalWay.nodes[i]));
      i += 1;
    }
    if (i === finalWay.nodes.length) {
      console.error("End node not found in final way");
      return [];
    }
  }
  path.push(endNode);
  return path;
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
    const path = pathBetweenWays(startNode, endNode, nodes, ways);
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

const getClosestBusStop = async (lat, lon, searchRadiusDegrees) => {
  const busStops = await OsmNode.find({
    lat: { $gte: lat - searchRadiusDegrees, $lte: lat + searchRadiusDegrees },
    lon: { $gte: lon - searchRadiusDegrees, $lte: lon + searchRadiusDegrees },
    "tags.highway": "bus_stop",
  });

  if (!busStops.length) return null;

  let closestBusStop = null;
  let closestDistance = Infinity;
  busStops.forEach((node) => {
    if (node.tags && node.tags.highway === "bus_stop") {
      const distance = Math.sqrt((node.lat - lat) ** 2 + (node.lon - lon) ** 2);
      console.log(distance, closestDistance);
      if (distance < closestDistance) {
        closestBusStop = node;
        closestDistance = distance;
      }
    }
  });

  // Now convert the closest bus stop to a corresponding navNode
  const tolerance = 0.1; // Adjust tolerance as needed
  const navBusStop = await NavNode.findOne({
    latitude: {
      $gte: closestBusStop.lat - tolerance,
      $lte: closestBusStop.lat + tolerance,
    },
    longitude: {
      $gte: closestBusStop.lon - tolerance,
      $lte: closestBusStop.lon + tolerance,
    },
  });

  if (!navBusStop) {
    console.error(
      "No matching NavNode found for bus stop OsmNode:",
      closestBusStop,
    );
    return null;
  }

  console.log("Closest Bus Stop: ", navBusStop);
  return navBusStop;
};

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

    const startBusStop = await getClosestBusStop(
      start.lat,
      start.lon,
      99999999,
    );
    const endBusStop = await getClosestBusStop(end.lat, end.lon, 99999999);

    if (startBusStop === null || endBusStop === null) {
      console.log(startBusStop, endBusStop);
      response
        .status(400)
        .json({ error: "No bus stops were found, try checking the db" });
      return;
    }

    const footpathToBusStop = pathBetweenNodes(
      getClosestNode(closeStartNodes, start.lat, start.lon),
      startBusStop,
      nodes,
      busWays,
    );

    const busPath = pathBetweenNodes(startBusStop, endBusStop, nodes, busWays);

    const footpathToEnd = pathBetweenNodes(
      endBusStop,
      getClosestNode(closeEndNodes, end.lat, end.lon),
      nodes,
      busWays,
    );

    response.json([...footpathToBusStop, ...busPath, ...footpathToEnd]);
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
