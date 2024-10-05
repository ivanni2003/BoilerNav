import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';

const baseURL = "http://localhost:3001";
const buildingAPI = `${baseURL}/api/ways/buildings`;
const nodeAPI = `${baseURL}/api/nodes`;
const nodeIDAPI = `${baseURL}/api/nodes/id`;

const MapViewUpdater = ({ latitude, longitude, zoom }) => {
    const map = useMap(); 

    useEffect(() => {
        map.setView([latitude, longitude], zoom); 
    }, [latitude, longitude, zoom, map]); 
};

const Map = ({ latitude, longitude, zoom}) => {
    // Fetch the building data
    const [buildings, setBuildings] = useState([]);
    
    const fetchBuildings = async () => {
        try {
            // Fetch the building data
            const buildingResponse = await axios.get(buildingAPI);
            // Each building will have to fetch its nodes
            // Use Promise.all to fetch all of the nodes for each building
            const buildingNodesResponses = await Promise.all(buildingResponse.data.map((building) => {
                const nodePromise = axios.get(`${nodeIDAPI}/${building.nodes.join(",")}`);
                return nodePromise;
            }));
            // Process building "ways" into usable data
            // Find the middle of all of each building's nodes and use that as the building's location
            // Loop iterates through each building's  nodes
            const processedBuildings = buildingNodesResponses.map((nodesResponse) => {
                const nodes = nodesResponse.data;
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
                const center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
                const radius = Math.max(maxLat - center[0], maxLon - center[1]);
                return { center, radius };
            });
            setBuildings(processedBuildings);
        } catch (error) {
            console.log(error);
            // setBuildings([{[latitude, longitude], 0.5}]);
        }
    };

    useEffect(() => {
        fetchBuildings();
    }, []);

    return (
        <MapContainer center={[latitude, longitude]} zoom={zoom} style={{ height: "600px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {
                // Display the buildings
                // Some centers are [NaN, NaN], so we need to check for that
                buildings.map((building, index) => {
                    if (isNaN(building.center[0]) || isNaN(building.center[1])) {
                        return null;
                    }
                    return <Circle key={index} center={building.center} radius={building.radius} fillColor="black" fillOpacity={0.5} />;
                })
            }
            <MapViewUpdater latitude={latitude} longitude={longitude} zoom={zoom} /> {/* Include the updater */}
        </MapContainer>
    );
};

export default Map;
