const axios = require("axios");
const Node = require("./models/osmNode");
const Way = require("./models/osmWay");
const NavNode = require("./models/navNode");
const NavWay = require("./models/navWay");

async function saveData() {
  // Find all ways with either:
  // 1. tags.highway = "footway"
  // 2. tags.highway = "steps"
  // 3. tags.footway exists
  const response = await Way.find({
    $or: [
      { "tags.highway": "footway" },
      { "tags.highway": "steps" },
      { "tags.footway": { $exists: true } },
    ],
  });
  if (!response || response.length < 0) {
    console.log("No ways found");
    return;
  }
  const ways = response;
  const wayNodes = await Promise.all(
    ways.map((way) => {
      const nodeQuery = Node.find({ id: { $in: way.nodes } });
      return nodeQuery;
    }),
  );

  // Ways may intersect or even start in the middle of another way
  // Make new ways that that end at intersections
  const nodeGraph = [];
  ways.forEach((way, wayIndex) => {
    const nodes = wayNodes[wayIndex];
    // Connect each adjacent node, making a new node if they don't exist
    for (let i = 0; i < nodes.length - 1; i++) {
      let nodeInGraph = nodeGraph.find((n) => n.id === nodes[i].id);
      if (!nodeInGraph) {
        nodeInGraph = {
          id: nodes[i].id,
          connectedNodes: [],
          latitude: nodes[i].lat,
          longitude: nodes[i].lon,
          visited: false,
        };
        nodeGraph.push(nodeInGraph);
      }
      const connectedNode = nodeGraph.find((n) => n.id === nodes[i + 1].id);
      if (connectedNode) {
        nodeInGraph.connectedNodes.push(connectedNode);
        connectedNode.connectedNodes.push(nodeInGraph);
      } else {
        const newConnectedNode = {
          id: nodes[i + 1].id,
          connectedNodes: [nodeInGraph],
          latitude: nodes[i + 1].lat,
          longitude: nodes[i + 1].lon,
          visited: false,
        };
        nodeGraph.push(newConnectedNode);
        nodeInGraph.connectedNodes.push(newConnectedNode);
      }
    }
  });

  // Create new ways that fit the requirements specified previously
  const newNavWays = [];
  const newNavNodes = [];
  const nodeQueue = [];
  // Find the first node that has more than 2 connected nodes
  const startNode = nodeGraph.find((node) => node.connectedNodes.length > 2);
  if (!startNode) {
    console.log("No start node found");
    return;
  }
  nodeQueue.push(startNode);
  while (nodeQueue.length > 0) {
    const currentNode = nodeQueue.shift();
    currentNode.visited = true;
    // Skip if all connected nodes have been visited
    const unvisitedNodes = currentNode.connectedNodes.filter(
      (node) => !node.visited,
    );
    if (unvisitedNodes.length === 0) {
      continue;
    }
    let currentNavNode = newNavNodes.find((node) => node.id === currentNode.id);
    if (!currentNavNode) {
      currentNavNode = {
        id: currentNode.id,
        ways: [],
        latitude: currentNode.latitude,
        longitude: currentNode.longitude,
      };
      newNavNodes.push(currentNavNode);
    }
    // Create new ways for each unvisited node
    unvisitedNodes.forEach((node) => {
      const newWay = {
        id: newNavWays.length,
        nodes: [currentNode.id],
        length: -1,
        connectedWays: [],
        type: "footpath",
      };
      newNavWays.push(newWay);
      currentNavNode.ways.push(newWay.id);
      // Travel along the connented nodes until a node with more than 2
      // connected nodes is found
      let nextNode = node;
      let prevNode = currentNode;
      while (nextNode.connectedNodes.length === 2) {
        newWay.nodes.push(nextNode.id);
        if (nextNode.visited) {
          console.log(
            "Node",
            nextNode.id,
            "already visited while traversing. Previous node: ",
            prevNode.id,
          );
        }
        nextNode.visited = true;
        let nextNavNode = newNavNodes.find((node) => node.id === nextNode.id);
        if (!nextNavNode) {
          nextNavNode = {
            id: nextNode.id,
            ways: [newWay.id],
            latitude: nextNode.latitude,
            longitude: nextNode.longitude,
          };
          newNavNodes.push(nextNavNode);
        } else {
          nextNavNode.ways.push(newWay.id);
        }
        // Find the next node
        const tempNode = nextNode;
        nextNode = nextNode.connectedNodes.find(
          (node) => node.id !== prevNode.id,
        );
        if (!nextNode) {
          console.log("No next node found while traversing");
          return;
        }
        prevNode = tempNode;
      }
      newWay.nodes.push(nextNode.id);
      nextNode.visited = true;
      if (nextNode.connectedNodes.length === 1) {
        const deadEndNavNode = {
          id: nextNode.id,
          ways: [newWay.id],
          latitude: nextNode.latitude,
          longitude: nextNode.longitude,
        };
        newNavNodes.push(deadEndNavNode);
      }
      if (nextNode.connectedNodes.length > 2) {
        let branchNode = newNavNodes.find((node) => node.id === nextNode.id);
        if (!branchNode) {
          branchNode = {
            id: nextNode.id,
            ways: [newWay.id],
            latitude: nextNode.latitude,
            longitude: nextNode.longitude,
          };
          newNavNodes.push(branchNode);
        }
        nodeQueue.push(nextNode);
      }
    });
    if (nodeQueue.length === 0) {
      // Find the next node with more than 2 connected nodes
      // If a node is found, it probably can't be reached from any of the
      // previously visited nodes Meaning that a route can't be found from the
      // last group of visited nodes
      const nextNode = nodeGraph.find(
        (node) => node.connectedNodes.length > 2 && !node.visited,
      );
      if (nextNode) {
        nodeQueue.push(nextNode);
      }
    }
  }

  // Debug info
  console.log("# of new ways: ", newNavWays.length);
  console.log("# of old ways: ", ways.length);
  console.log("# of new nodes: ", newNavNodes.length);
  // Find number of nodes in newNavNodes with uniqie ids
  const numNodesInNavNodes = new Set(newNavNodes.map((node) => node.id)).size;
  console.log(
    "# of nodes in newNavNodes with unique IDs: ",
    numNodesInNavNodes,
  );
  console.log("# of nodes in nodeGraph: ", nodeGraph.length);
  // Count number of nodes in wayNodes with unique ids
  const numNodesInWayNodes = new Set(
    wayNodes.reduce((acc, nodes) => {
      nodes.forEach((node) => acc.push(node.id));
      return acc;
    }, []),
  ).size;
  console.log("# of nodes in wayNodes: ", numNodesInWayNodes);
  const numUnvisitedNodes = nodeGraph.filter((node) => !node.visited).length;
  console.log("# of unvisited nodes: ", numUnvisitedNodes);

  // Problem node ??
  // console.log(nodeGraph.find((node) => node.id === 9575283733));

  // Fill each way's connectedWays array
  // For every node with more than 1 way connected to it
  // For each way connected to the node, add the other ways connected to the
  // node
  newNavNodes.forEach((node) => {
    if (node.ways.length > 1) {
      node.ways.forEach((wayId) => {
        const way = newNavWays.find((way) => way.id === wayId);
        if (!way) {
          console.log("Way", wayId, "not found while updating connected ways");
        } else {
          way.connectedWays = way.connectedWays.concat(
            node.ways.filter((id) => id !== wayId),
          );
        }
      });
    }
  });

  // Fill the length of each way
  // For each way, calculate the distance between each node
  // Add the distances together to get the total length
  // Lengths are in meters
  newNavWays.forEach((way) => {
    let length = 0;
    for (let i = 0; i < way.nodes.length - 1; i++) {
      const node1 = newNavNodes.find((node) => node.id === way.nodes[i]);
      const node2 = newNavNodes.find((node) => node.id === way.nodes[i + 1]);
      if (!node1 || !node2) {
        console.log("Node not found while calculating length");
        return;
      }
      const dLat = node2.latitude - node1.latitude;
      const dLon = node2.longitude - node1.longitude;
      const dxm = dLat * 111111;
      const dym = dLon * 111111 * Math.cos((node1.latitude * Math.PI) / 180);
      const distance = Math.sqrt(dxm * dxm + dym * dym);
      length += distance;
    }
    way.length = length;
  });

  console.log("5 new ways:\n---\n", newNavWays.slice(0, 5));
  console.log("5 new nodes:\n---\n", newNavNodes.slice(0, 5));

  // console.log("NavWays and NavNodes updated");
}

module.exports = saveData;
