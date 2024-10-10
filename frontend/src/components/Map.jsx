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

const PopupContent = ({ building, viewIndoorPlan, getDirections, user, showNotification, favoriteLocations, isLoadingFavorites, onFavoriteToggle }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && !isLoadingFavorites) {
      setIsFavorite(favoriteLocations.some(fav => fav.buildingId === building.id.toString()));
    } else {
      setIsFavorite(false);
    }
  }, [building.id, favoriteLocations, isLoadingFavorites, user]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      showNotification('Please log in to save favorites', 'error');
      return;
    }

    setIsUpdating(true);
    const newFavoriteStatus = !isFavorite;

    try {
      const buildingData = {
        name: building.tags.name || 'Unnamed Building',
        lat: building.buildingPosition.lat,
        lon: building.buildingPosition.lon,
        buildingId: building.id.toString()
      };

      if (newFavoriteStatus) {
        await axios.post(`${baseURL}/api/users/${user.id}/favorites`, buildingData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.delete(`${baseURL}/api/users/${user.id}/favorites/${building.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }

      setIsFavorite(newFavoriteStatus);
      onFavoriteToggle(building.id, newFavoriteStatus, buildingData);
      showNotification(newFavoriteStatus ? 'Location saved to favorites!' : 'Location removed from favorites!', 'success');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showNotification('Failed to update favorite. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      {building.tags.name ? <h2>{building.tags.name}</h2> : <h2>Building</h2>}
      <p>More content...</p>
      <div className="popup-buttons">
        <button onClick={() => viewIndoorPlan(building)}>View Indoors</button>
        <button onClick={handleFavoriteToggle} disabled={isLoadingFavorites || isUpdating}>
          {isLoadingFavorites ? 'Loading...' : 
          isUpdating ? 'Updating...' :
          (isFavorite ? 'Unsave from favorites' : 'Save as Favorite')}
        </button>
        <button onClick={() => getDirections(building)}>Directions</button>
      </div>
    </div>
  );
};


const BuildingsRenderer = ({ buildings, viewIndoorPlan, getDirections, user, showNotification, favoriteLocations, isLoadingFavorites, onFavoriteToggle }) => {
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
      <Popup>
        <PopupContent 
        building={building} 
        viewIndoorPlan={viewIndoorPlan}  
        getDirections={getDirections} 
        user={user} 
        showNotification={showNotification}
        favoriteLocations={favoriteLocations}
        isLoadingFavorites={isLoadingFavorites}
        onFavoriteToggle={onFavoriteToggle}/>
      </Popup>
    </CircleMarker>
  });
}


const Map = ({ latitude, longitude, zoom, buildings, userLocation, accuracy, altitude, heading, viewIndoorPlan, saveFavoriteRoute, getDirections }) => {
  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="transform: rotate(${heading || 0}deg); width: 32px; height: 32px;">
        <img src="${arrowIcon}" style="width: 100%; height: 100%;" alt="Marker" />
      </div>
    `,
    iconAnchor: [16, 16] // Center the icon
  });
  return (
    <MapContainer center={[latitude, longitude]} zoom={zoom} zoomControl={false} className="map-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <BuildingsRenderer 
        buildings={buildings} 
        viewIndoorPlan={viewIndoorPlan} 
        getDirections={getDirections}
        user={user}
        showNotification={showNotification}
        favoriteLocations={favoriteLocations}
        isLoadingFavorites={isLoadingFavorites}
        onFavoriteToggle={onFavoriteToggle}
      />
      <MapViewUpdater latitude={latitude} longitude={longitude} zoom={zoom} /> {/* Include the updater */}
      {userLocation && (
                <>
                    {/* Render Marker regardless of altitude */}
                    <Marker position={userLocation} icon = {customIcon}>
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
