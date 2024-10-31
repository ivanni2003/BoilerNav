const axios = require('axios');
const fs = require('fs');
const path = require('path');

const Node = require("./models/osmNode");
const Way = require("./models/osmWay");
const NavNode = require("./models/navNode");
const NavWay = require("./models/navWay");

async function getData() {
    try {
        const data = await Way.find({
            "tags.highway": { $exists: true, $eq: "bus_stop" }
        });
        console.log(data);
    } catch (error) {
        console.error('Error fetching bus stops:', error);
    }
}
getData();

// async function postGeojsonData() {
//     // Path to your Node0.geojson file
//     const filePath = path.join(__dirname, 'Node0.geojson');

//     // Read the content of the geojson file
//     const geojsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

//     try {
//         // Send a POST request to the API
//         const response = await axios.post('http://localhost:3001/api/indoordata', geojsonData, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });
//         console.log('Data posted successfully:', response.data);
//     } catch (error) {
//         console.error('Error posting data:', error.response ? error.response.data : error.message);
//     }
// }

// postGeojsonData();