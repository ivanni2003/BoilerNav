import React, { useState } from 'react'
import SearchBar from './SearchBar'
import './DirectionsMenu.css'
import axios from 'axios'

const DirectionsMenu = ({ 
  items, 
  updateMap, 
  updateStart, 
  start, 
  destination, 
  closeDirections, 
  handleRouting, 
  manhattanDistance, 
  walkingTime,
  selectedMode,
  user,
  polylineCoordinates,
  showNotification
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const saveRoute = async () => {
    if (!user) {
      showNotification('Please log in to save routes', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const routeData = {
        userId: user.id,
        startLocation: {
          lat: start[0],
          lon: start[1],
          name: 'Start Location'
        },
        endLocation: {
          lat: destination.buildingPosition.lat,
          lon: destination.buildingPosition.lon,
          name: destination.tags.name || 'Unnamed Destination'
        },
        distance: manhattanDistance,
        duration: walkingTime,
        travelMode: selectedMode,
        polyline: polylineCoordinates.map(coord => ({ lat: coord[0], lon: coord[1] }))
      };

      const response = await axios.post('http://localhost:3001/api/routes', routeData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      showNotification('Route saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving route:', error);
      showNotification('Failed to save route. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="directions-menu">
      <div className="search-bar">
        <SearchBar items={items} updateMap={updateMap} updateStart={updateStart} start={start} destination={null} />
      </div>
      <div className="search-bar">
        <SearchBar items={items} updateMap={updateMap} updateStart={updateStart} start={null} destination={destination} />
      </div>
      <div className="button-container">
        <button className="directions-button" onClick={closeDirections}>Close</button>
        <button className="directions-button" onClick={() => handleRouting()}>Go</button>
      </div>
      <div className="distance-info">
        {manhattanDistance && walkingTime ? (
          <>
            <p style={{fontSize:"10px"}}><strong>Distance:</strong> {manhattanDistance} miles</p>
            <p style={{fontSize:"10px"}}><strong>Est. Walking Time:</strong> {walkingTime} minutes</p>
            <button 
              className="save-route-button" 
              onClick={saveRoute}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Route as Favorite'}
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default DirectionsMenu