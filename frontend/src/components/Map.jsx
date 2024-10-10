import axios from 'axios';
import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import arrowIcon from '../img/up-arrow.png';

import { MapContainer, TileLayer, CircleMarker, Marker, useMap, Polyline, Circle, Popup } from 'react-leaflet';


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


const Map = ({ latitude, longitude, zoom, buildings, userLocation, accuracy, altitude, heading, viewIndoorPlan, saveFavoriteRoute, getDirections, polylineCoordinates}) => {
  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="transform: rotate(${heading || 0}deg); width: 32px; height: 32px;">
        <img src="${arrowIcon}" style="width: 100%; height: 100%;" alt="Marker" />
      </div>
    `,
    iconAnchor: [16, 16] // Center the icon
  });
  const updatedPolylineCoordinates = userLocation
    ? [...(polylineCoordinates || []), userLocation] // Add userLocation at the end
    : polylineCoordinates;
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
                    <Marker position={userLocation} icon = {customIcon}>
                        <Popup>
                            Lat: {userLocation[0]} <br />
                            Long: {userLocation[1]} <br />
                            {altitude && <>Alt: {altitude} m</>}
                            {accuracy && <>Accuracy: {accuracy} m</>}
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
            {updatedPolylineCoordinates && (
              <Polyline positions={updatedPolylineCoordinates} color="blue" />
            )}
    </MapContainer>
  );
};
export default Map;
