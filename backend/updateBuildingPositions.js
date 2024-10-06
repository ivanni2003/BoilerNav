const axios = require("axios");
const Node = require("./models/osmNode");
const Way = require("./models/osmWay");

async function saveData() {
  const response = await Way.find({ "tags.building": { $exists: true } });

  if (response && response.length > 0) {
    // categorizing data from query
    const buildings = response;
    const buildingNodes = await Promise.all(
      buildings.map((building) => {
        const nodeQuery = Node.find({ id: { $in: building.nodes } });
        return nodeQuery;
      }),
    );

    // Iterate through both buildings and their nodes, calculating the center
    // and radius of each building The center is the average of the latitudes
    // and longitudes of the nodes
    const processedBuildings = buildingNodes.map((nodes) => {
      const lats = [];
      const lons = [];
      nodes.forEach((node) => {
        lats.push(node.lat);
        lons.push(node.lon);
      });
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const pos = {
        lat: (minLat + maxLat) / 2,
        lon: (minLon + maxLon) / 2,
      };
      const rad = Math.min(maxLat - pos.lat, maxLon - pos.lon);
      return { pos, rad };
    });

    // Add the buildingPosition field to each building
    buildings.forEach((building, index) => {
      building.buildingPosition = {
        lat: processedBuildings[index].pos.lat,
        lon: processedBuildings[index].pos.lon,
        rad: processedBuildings[index].rad,
      };
    });

    // Save the updated buildings to the database
    Way.bulkSave(buildings);
    console.log("Buildings updated");
  } else {
    console.log("No buildings found");
  }
}

module.exports = saveData;
