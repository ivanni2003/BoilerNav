const fs = require("fs");

// Helper function to calculate distance in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Load GeoJSON data from file
async function loadGeoJSON(path) {
    const data = await fs.promises.readFile(path, "utf8");
    return JSON.parse(data).features;
}

// Build graph from features
function buildGraph(features) {
    const graph = new Map();
    features.forEach((feature) => {
        const nodeId = feature.properties.id;
        const linkedNodes = feature.properties.LinkedTo.split(",").map(Number);
        graph.set(nodeId, linkedNodes);
    });
    return graph;
}

function latLonToXY(lat, lon) {
    // Here, you need to adjust the min/max values according to your data
    canvasWidth = 100;
    canvasHeight = 100;
    const minLat = 40.427; // Minimum latitude
    const maxLat = 40.428; // Maximum latitude
    const minLon = -86.917; // Minimum longitude
    const maxLon = -86.916; // Maximum longitude
    //40.428193270497175, -86.91720299128373
    //40.42738132339402, -86.9167784430074
    const x = ((lon - minLon) / (maxLon - minLon)) * canvasWidth; // Scale to canvas width
    const y = ((maxLat - lat) / (maxLat - minLat)) * canvasHeight; // Scale to canvas height, inverted for y-axis
    return { x, y };
}

// Modified Dijkstra's algorithm to calculate total distance
function dijkstra(graph, features, startNode, endNode) {
    const cost = new Map();
    const parent = new Map();
    const priorityQueue = new Set([startNode]);

    graph.forEach((_, nodeId) => cost.set(nodeId, Infinity));
    cost.set(startNode, 0);

    while (priorityQueue.size > 0) {
        const currentNode = [...priorityQueue].reduce((minNode, node) =>
            cost.get(node) < cost.get(minNode) ? node : minNode
        );
        priorityQueue.delete(currentNode);

        if (currentNode === endNode) {
            const path = [];
            let node = endNode;
            let totalDistance = 0;
            let previousFloor = features.find(f => f.properties.id === currentNode).properties.Floor;
            

            while (node !== null) {
                const { coordinates: [lon, lat] } = features.find(f => f.properties.id === node).geometry;
                const {x, y} = latLonToXY(lat,lon);
                path.unshift({x,y});
                const prevNode = parent.get(node) || null;
                if (prevNode !== null) {
                    const { coordinates: [lon1, lat1] } = features.find(f => f.properties.id === node).geometry;
                    const { coordinates: [lon2, lat2] } = features.find(f => f.properties.id === prevNode).geometry;
                    const currentFloor = features.find(f => f.properties.id === prevNode).properties.Floor;
                    totalDistance += getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
                    const prevRoom = features.find(f => f.properties.id === prevNode).properties.Type;
                    if (currentFloor !== previousFloor && prevRoom != "Elevator") {
                        totalDistance += 0.003; // Add 10 feet for floor change
                    }
                    previousFloor = currentFloor;
                }
                node = prevNode;
            }
            totalDistance *= 1000;
            return { path, totalDistance };
        }

        graph.get(currentNode).forEach((neighbor) => {
            const { coordinates: [lon1, lat1] } = features.find(f => f.properties.id === currentNode).geometry;
            const { coordinates: [lon2, lat2] } = features.find(f => f.properties.id === neighbor).geometry;
            const distance = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
            const newCost = cost.get(currentNode) + distance;

            if (newCost < cost.get(neighbor)) {
                cost.set(neighbor, newCost);
                parent.set(neighbor, currentNode);
                priorityQueue.add(neighbor);
            }
        });
    }
    return null;  // No path found
}

// Main function to load GeoJSON and find path
async function findPath(geoJsonPath, startNode, endNode) {
    const features = await loadGeoJSON(geoJsonPath);
    const graph = buildGraph(features);
    return dijkstra(graph, features, startNode, endNode);
}

// Usage example
findPath("./Node0.geojson", 1, 48)
    .then(({ path, totalDistance }) => console.log("Path:", path, "Total Distance (m):", totalDistance))
    .catch((error) => console.error("Error:", error));

module.exports = findPath;