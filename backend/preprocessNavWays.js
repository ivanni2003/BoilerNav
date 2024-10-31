const Node = require("./models/osmNode");
const Way = require("./models/osmWay");
const NavNode = require("./models/navNode");
const NavWay = require("./models/navWay");

// DEBUG: For writing to a file
const fs = require("fs");

async function saveData() {
  console.log("Preprocessing navWays");
  const response = await Way.find({
    $or: [
      { "tags.highway": "footway" },
      { "tags.highway": "steps" },
      { "tags.highway": "bus_stop" },
      { "tags.footway": { $exists: true } },
      { "tags.foot": "designated" },
    ],
  });
  if (!response || response.length < 0) {
    console.log("No ways found");
    return;
  }
  const ways = response;
  const wayNodesFromDatabase = await Promise.all(
    ways.map((way) => {
      const nodeQuery = Node.find({ id: { $in: way.nodes } });
      return nodeQuery;
    }),
  );

  // Sort each list of nodes in wayNodes by the order they appear in the way
  const wayNodes = wayNodesFromDatabase.map((nodes, index) => {
    const way = ways[index];
    return way.nodes.map((id) => {
      return nodes.find((node) => node.id === id);
    });
  });

  console.log("# of ways: ", ways.length);
  console.log("# of wayNodes: ", wayNodes.length);

  // Ways may intersect or even start in the middle of another way
  // Make new ways that end when an intersection is reached
  // nodeGraph is an array of nodes with this structure:
  // {
  //  id: number,
  //  connectedNodes: [node1, node2, ...],
  //  latitude: number,
  //  longitude: number,
  //  visited: boolean
  // }
  console.log("Building temporary nodeGraph");
  const nodeGraph = [];
  wayNodes.forEach((nodes) => {
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
      let connectedNode = nodeGraph.find((n) => n.id === nodes[i + 1].id);
      if (!connectedNode) {
        connectedNode = {
          id: nodes[i + 1].id,
          connectedNodes: [],
          latitude: nodes[i + 1].lat,
          longitude: nodes[i + 1].lon,
          visited: false,
        };
        nodeGraph.push(connectedNode);
      }
      nodeInGraph.connectedNodes.push(connectedNode);
      connectedNode.connectedNodes.push(nodeInGraph);
    }
  });

  // // Write nodeGraph to a file
  // console.log("Writing nodeGraph to nodeGraph.json");
  // // Convert nodeGraph so objects can be written to a file
  // const nodeGraphCopy = nodeGraph.map((node) => {
  //   return {
  //     id: node.id,
  //     connectedNodes: node.connectedNodes.map((n) => n.id),
  //     latitude: node.latitude,
  //     longitude: node.longitude,
  //     visited: node.visited,
  //   };
  // });
  // // Write to file (Will cause node to restart constantly since node detects
  // // changes)
  // fs.writeFileSync("nodeGraph.json", JSON.stringify(nodeGraphCopy));
  // console.log("nodeGraph written to nodeGraph.json");

  // Debug info
  console.log("5 nodes in nodeGraph:\n---\n", nodeGraph.slice(0, 5));

  // Create new ways that fit the requirements specified previously
  const newNavWays = [];
  const newNavNodes = [];
  // branchingGraphNodes is used to traverse the nodeGraph
  const branchingGraphNodes = nodeGraph.filter(
    (node) => node.connectedNodes.length > 2,
  );
  if (branchingGraphNodes.length === 0) {
    console.log("No branching nodes found");
    return;
  }
  for (branchGraphNode of branchingGraphNodes) {
    branchGraphNode.visited = true;
    let branchNavNode = newNavNodes.find(
      (node) => node.id === branchGraphNode.id,
    );
    if (!branchNavNode) {
      branchNavNode = {
        id: branchGraphNode.id,
        ways: [],
        latitude: branchGraphNode.latitude,
        longitude: branchGraphNode.longitude,
      };
      newNavNodes.push(branchNavNode);
    }
    // Find all unvisited nodes connected to the branchGraphNode
    // Filter out branching nodes (connectedNodes.length > 2) (those ways will
    // be handled later)
    const unvisitedNodes = branchGraphNode.connectedNodes.filter(
      (node) => !node.visited && node.connectedNodes.length <= 2,
    );
    // Skip if all connected nodes have been visited
    if (unvisitedNodes.length === 0) {
      continue;
    }
    // Create new ways for each unvisited node
    unvisitedNodes.forEach((node) => {
      const newWay = {
        id: newNavWays.length,
        nodes: [branchNavNode.id],
        length: -1,
        connectedWays: [],
        type: "footpath",
      };
      newNavWays.push(newWay);
      branchNavNode.ways.push(newWay.id);
      // Travel along the connented nodes until a node with more than 2
      // connected nodes is found or a dead end is reached (1 connected node)
      let nextNode = node;
      let prevNodeID = branchGraphNode.id;
      while (nextNode.connectedNodes.length === 2) {
        newWay.nodes.push(nextNode.id);
        if (nextNode.visited) {
          console.log(
            "Node",
            nextNode.id,
            "already visited while traversing. Previous node:",
            prevNodeID,
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
        const tempPrevID = prevNodeID;
        prevNodeID = nextNode.id;
        nextNode = nextNode.connectedNodes.find(
          (node) => node.id !== tempPrevID,
        );
        if (!nextNode) {
          console.log("No next node found while traversing");
          return;
        }
      }
      newWay.nodes.push(nextNode.id);
      nextNode.visited = true;
      if (nextNode.connectedNodes.length === 1) {
        if (newNavNodes.find((node) => node.id === nextNode.id)) {
          console.log(
            "Dead end node",
            nextNode.id,
            "already in newNavNodes while traversing",
          );
        }
        const deadEndNavNode = {
          id: nextNode.id,
          ways: [newWay.id],
          latitude: nextNode.latitude,
          longitude: nextNode.longitude,
        };
        newNavNodes.push(deadEndNavNode);
      } else if (nextNode.connectedNodes.length > 2) {
        let endBranchNode = newNavNodes.find((node) => node.id === nextNode.id);
        if (!endBranchNode) {
          endBranchNode = {
            id: nextNode.id,
            ways: [newWay.id],
            latitude: nextNode.latitude,
            longitude: nextNode.longitude,
          };
          newNavNodes.push(endBranchNode);
        } else {
          endBranchNode.ways.push(newWay.id);
        }
      }
    });
  }

  // Create ways between branching nodes
  // Make sure only one way is made for each pair of connected branching nodes
  const branchingNodesFilteredConnectedNodes = [];
  const branchingNodesFiltered = branchingGraphNodes.filter((node) => {
    const connectedNodes = node.connectedNodes.filter(
      (node) => node.connectedNodes.length > 2,
    );
    if (connectedNodes.length > 0) {
      branchingNodesFilteredConnectedNodes.push(connectedNodes);
      return true;
    }
    return false;
  });
  const branchingNodePairs = [];
  branchingNodesFiltered.forEach((node, index) => {
    const connectedNodes = branchingNodesFilteredConnectedNodes[index];
    connectedNodes.forEach((connectedNode) => {
      if (
        !branchingNodePairs.find(
          (pair) =>
            (pair[0] === node && pair[1] === connectedNode) ||
            (pair[0] === connectedNode && pair[1] === node),
        )
      ) {
        branchingNodePairs.push([node, connectedNode]);
      }
    });
  });
  branchingNodePairs.forEach((pair) => {
    const newWay = {
      id: newNavWays.length,
      nodes: [pair[0].id, pair[1].id],
      length: -1,
      connectedWays: [],
      type: "footpath",
    };
    newNavWays.push(newWay);
    const navNode1 = newNavNodes.find((node) => node.id === pair[0].id);
    const navNode2 = newNavNodes.find((node) => node.id === pair[1].id);
    navNode1.ways.push(newWay.id);
    navNode2.ways.push(newWay.id);
  });

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

  // Save the new navNodes and navWays
  await NavNode.deleteMany({});
  await NavWay.deleteMany({});
  await NavNode.insertMany(newNavNodes);
  await NavWay.insertMany(newNavWays);
  console.log("NavWays and NavNodes updated");
}

module.exports = saveData;
