import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

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

const PopupContent = ({ building }) => {
  return (
    <div>
      { building.tags.name ? <h2>{building.tags.name}</h2> : <h2>Building</h2> }
      <p>More content...</p>
    </div>
  );
}

const BuildingsRenderer = ({ buildings }) => {
  const buildingPathOptions = {
    color: 'black',
    fillColor: 'gold',
  };
  return buildings.map((building, index) => {
    // building.buildingPosition.rad is in lat/lon, while circle radius is in meters
    // here I've done some rough conversion to make the circles reasonable
    const minSize = 7;
    const buildingSize = building.buildingPosition.rad * 100000 / 4 > minSize ? 
      building.buildingPosition.rad * 100000 / 4 : 
      minSize;
    return <CircleMarker
      key={index}
      center={[building.buildingPosition.lat, building.buildingPosition.lon]}
      radius={buildingSize}
      pathOptions={buildingPathOptions}
      >
      <Popup><PopupContent building={building} /></Popup>
    </CircleMarker>
  });
}

const Map = ({ latitude, longitude, zoom, buildings }) => {
  return (
    <MapContainer center={[latitude, longitude]} zoom={zoom} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <BuildingsRenderer buildings={buildings} />
      <MapViewUpdater latitude={latitude} longitude={longitude} zoom={zoom} /> {/* Include the updater */}
    </MapContainer>
  );
};

export default Map;
