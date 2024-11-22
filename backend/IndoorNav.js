const fs = require("fs");

// Build graph from features
function buildGraph(features) {
  const graph = new Map();
  features.forEach((feature) => {
    const nodeId = feature.properties.id;
    const linkedNodes = feature.properties.LinkedTo;
    graph.set(nodeId, linkedNodes);
  });
  return graph;
}

// Modified Dijkstra's algorithm to calculate total distance
function dijkstra(graph, indoorData, startNode, endNode) {
  const features = indoorData.features;
  const cost = new Map();
  const parent = new Map();
  const priorityQueue = new Set([startNode]);

  graph.forEach((_, nodeId) => cost.set(nodeId, Infinity));
  cost.set(startNode, 0);

  while (priorityQueue.size > 0) {
    const currentNode = [...priorityQueue].reduce((minNode, node) =>
      cost.get(node) < cost.get(minNode) ? node : minNode,
    );
    priorityQueue.delete(currentNode);

    if (currentNode === endNode) {
      const path = [];
      let node = endNode;
      let totalDistance = 0;
      let previousFloor = features.find((f) => f.properties.id === currentNode)
        .properties.Floor;

      while (node !== null) {
        const currentFeature = features.find((f) => f.properties.id === node);
        const { x, y } = currentFeature.geometry;
        // const { x, y } = latLonToXY(lat, lon);
        const floor = currentFeature.properties.Floor;
        path.unshift({ x, y, floor });
        const prevNode = parent.get(node) || null;
        if (prevNode !== null) {
          const prevFeature = features.find(
            (f) => f.properties.id === prevNode,
          );
          const { x: x1, y: y1 } = currentFeature.geometry;
          const { x: x2, y: y2 } = prevFeature.geometry;
          const currentFloor = prevFeature.properties.Floor;
          totalDistance +=
            Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) * indoorData.scale;
          const prevRoom = prevFeature.properties.Type;
          if (currentFloor !== previousFloor && prevRoom != "Elevator") {
            // totalDistance += 0.003; // Add 10 feet for floor change
            totalDistance += 3; // Add 3 meters for floor change
          }
          previousFloor = currentFloor;
        }
        node = prevNode;
      }
      return { route: path, distance: totalDistance };
    }

    const currentNodeFeature = features.find(
      (f) => f.properties.id === currentNode,
    );
    const { x: x1, y: y1 } = currentNodeFeature.geometry;

    graph.get(currentNode).forEach((neighbor) => {
      const neighborFeature = features.find(
        (f) => f.properties.id === neighbor,
      );
      const { x: x2, y: y2 } = neighborFeature.geometry;
      const distance =
        Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) * indoorData.scale;
      const newCost = cost.get(currentNode) + distance;

      if (newCost < cost.get(neighbor)) {
        cost.set(neighbor, newCost);
        parent.set(neighbor, currentNode);
        priorityQueue.add(neighbor);
      }
    });
  }
  return { route: [], distance: 0 };
}

// Main function to load GeoJSON and find path
async function findPath(floorData, startNode, endNode) {
  // const features = await loadGeoJSON(geoJsonPath);
  const features = floorData.features;
  const graph = buildGraph(features);
  const start = Number(startNode);
  const end = Number(endNode);

  if (!graph.has(start) || !graph.has(end)) {
    throw new Error("Start or end node not found in the graph.");
  }
  return dijkstra(graph, floorData, start, end);
}

// Usage example
// findPath("./Node0.geojson", 1, 10)
//    .then(({ path, totalDistance }) => console.log("Path:", path, "Total
//    Distance (m):", totalDistance)) .catch((error) => console.error("Error:",
//    error));

if (require.main === module) {
  // This code only runs when you execute 'node IndoorNav.js' directly

  // Access command-line arguments
  const args = process.argv.slice(2);

  // Check if both arguments are provided
  if (args.length < 2 || args.length > 2) {
    console.error("Error: Please provide both arguments (arg1 and arg2).");
    process.exit(1); // Exit the program with an error code
  }
  const avgMsRate = 1.3;
  // If both arguments exist, assign them
  const startNode = args[0] ? Number(args[0]) : 1; // Default to 1 if no argument
  const endNode = args[1] ? Number(args[1]) : 3; // Default to 3 if no argument

  findPath("./Node0.geojson", startNode, endNode)
    .then(({ route, distance }) =>
      console.log(
        "Path:",
        route,
        "Total Distance (m):",
        distance.toFixed(2),
        "Total Time (minutes):",
        (distance / avgMsRate / 60).toFixed(2),
      ),
    )
    .catch((error) => console.error("Error:", error));

  // Continue with the rest of your code
}

module.exports = {
  findPath,
};
