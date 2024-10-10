import axios from 'axios';
import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './Map.css';

import { MapContainer, TileLayer, CircleMarker, Marker, useMap, Polyline, Circle, Popup } from 'react-leaflet';


const baseURL = "http://localhost:3001";
const buildingAPI = `${baseURL}/api/ways/buildings`;
const nodeAPI = `${baseURL}/api/nodes`;
const nodeIDAPI = `${baseURL}/api/nodes/id`;


const MapViewUpdater = ({ latitude, longitude, zoom }) => {
  const map = useMap(); 

  var SouthWestCoords = [40.41602275997173, -86.9300490901509];
  var NorthEastCoords = [40.436762526584644, -86.90957099760823];
  var WL_Bounds = [SouthWestCoords, NorthEastCoords]; 
  map.setMaxBounds(WL_Bounds);
  map.setMinZoom(15);

  useEffect(() => {
    map.setView([latitude, longitude], zoom); 
  }, [latitude, longitude, zoom, map]); 
};

const PopupContent = ({ building, viewIndoorPlan, saveFavoriteRoute, getDirections}) => {
  return (
    <div>
      { building.tags.name ? <h2>{building.tags.name}</h2> : <h2>Building</h2> }
      <p>More content...</p>
      <div className="popup-buttons">
        <button onClick={() => viewIndoorPlan(building)}>View Indoors</button>
        <button onClick={() => saveFavoriteRoute(building)}>Save as Favorite</button>
        <button onClick={() => getDirections(building)}>Directions</button>
      </div>
      
    </div>
  );
}

const BuildingsRenderer = ({ buildings, viewIndoorPlan, saveFavoriteRoute, getDirections }) => {
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
      <Popup><PopupContent building={building} viewIndoorPlan={viewIndoorPlan} saveFavoriteRoute={saveFavoriteRoute} getDirections={getDirections}/></Popup>
    </CircleMarker>
  });
}


const Map = ({ latitude, longitude, zoom, buildings, userLocation, accuracy, altitude, viewIndoorPlan, saveFavoriteRoute, getDirections }) => {
  return (
    <MapContainer center={[latitude, longitude]} zoom={zoom} zoomControl={false} className="map-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <BuildingsRenderer buildings={buildings} viewIndoorPlan={viewIndoorPlan} saveFavoriteRoute={saveFavoriteRoute} getDirections={getDirections}/>
      <MapViewUpdater latitude={latitude} longitude={longitude} zoom={zoom} /> {/* Include the updater */}
      {userLocation && (
                <>
                    {/* Render Marker regardless of altitude */}
                    <Marker position={userLocation}>
                        <Popup>
                            Lat: {userLocation[0]} <br />
                            Long: {userLocation[1]} <br />
                            {altitude && <>Alt: {altitude} m</>}
                        </Popup>
                    </Marker>
                    {accuracy && (
                        <Circle
                            center={userLocation}
                            radius={accuracy} // Accuracy in meters
                            color="blue"
                            fillColor="blue"
                            fillOpacity={.2}
                        />
                    )}
                </>
            )}
    </MapContainer>
  );
};
export default Map;
