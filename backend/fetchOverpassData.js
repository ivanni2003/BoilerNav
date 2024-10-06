const axios = require('axios')
const Node = require('./models/osmNode')
const Way = require('./models/osmWay')
const Relation = require('./models/osmRelation')

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
      // getting query result
      const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`);
      return response.data.elements;
    } catch (exception) {
      console.log('Fetch Failed:' + exception);
      return [];
    }
  }

  async function saveData() {

    const data = await fetchOverpassData();   // contains all data from query
  
    if (data && data.length > 0) {
      // categorizing data from query
      const nodes = data.filter(element => element.type === 'node');
      const ways = data.filter(element => element.type === 'way');
      const relations = data.filter(element => element.type === 'relation');
    
      console.log(`${nodes.length} nodes, ${ways.length} ways, and ${relations.length} relations`);

      try {
        await Relation.insertMany(relations, { ordered: false });
        console.log("Relations inserted");
      } catch (exception) {
          console.log("Relation insert issue:" + exception);
      }
      
      try {
        await Node.insertMany(nodes, { ordered: false });
        console.log("Nodes inserted");
      } catch (exception) {
        console.log("Node insert issue:" + exception);
    }
      
      try {
        await Way.insertMany(ways, { ordered: false });
        console.log("Ways inserted");
      } catch (exception) {
        console.log("Way insert issue" + exception);
    }

    console.log("Insert Done")

    } else {
      console.log('No data fetched');
    }
  }
  
  module.exports = saveData;