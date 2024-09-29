const axios = require('axios')
const Node = require('./models/osm_node')
const Way = require('./models/osm_way')
const Relation = require('./models/osm_relation')

async function fetchOverpassData() {
    const overpassUrl = 'https://overpass-api.de/api/interpreter'
    const query = `
        [out:json];
        (
        node(40.4170, -86.9271, 40.4330, -86.9100); // Nodes with amenities
        way(40.4170, -86.9271, 40.4330, -86.9100); // Ways (roads)
        relation(40.4170, -86.9271, 40.4330, -86.9100); // Relations (routes)
        );
        out body;
        >;
        out skel qt;
        `
  
    try {
      const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`);
      return response.data.elements; // elements returned from query
    } catch (exception) {
      console.error('Fetch Failed:' + exception);
      return [];
    }
  }

  async function saveData() {

    const data = await fetchOverpassData();
  
    if (data && data.length > 0) {
      const nodes = data.filter(element => element.type === 'node');
      const ways = data.filter(element => element.type === 'way');
      const relations = data.filter(element => element.type === 'relation');
    
      await Node.insertMany(nodes);
      await Way.insertMany(ways);
      await Relation.insertMany(relations);
  
      console.log(`Inserted ${nodes.length} nodes, ${ways.length} ways, and ${relations.length} relations into MongoDB.`);
    } else {
      console.log('No data fetched');
    }
  }
  
  module.exports = saveData;