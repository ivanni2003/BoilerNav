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

const Map = ({ latitude, longitude, zoom, buildings }) => {

  return (
    <MapContainer center={[latitude, longitude]} zoom={zoom} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {
        // Display the buildings
        buildings.map((building, index) => {
          return <Circle key={index} center={[building.buildingPosition.lat, building.buildingPosition.lon]} radius={building.buildingPosition.rad} fillColor="black" fillOpacity={0.5} />;
        })
      }
      <MapViewUpdater latitude={latitude} longitude={longitude} zoom={zoom} /> {/* Include the updater */}
    </MapContainer>
  );
};

export default Map;
