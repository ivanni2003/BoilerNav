import React, { useState } from 'react'
import './DirectionsMenu.css'
import axios from 'axios'

const DirectionsMenu = ({
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
      <input 
        className="input-field" 
        type="text" 
        value={start ? "Current Location" : ""} 
        placeholder="Start Location"
        readOnly 
      />
      <input 
        className="input-field" 
        type="text" 
        value={destination ? destination.tags.name : ""} 
        placeholder="Destination"
        readOnly 
      />
      <div className="button-container">
        <button className="directions-button" onClick={closeDirections}>Close</button>
        <button className="directions-button" onClick={handleRouting}>Go</button>
      </div>
      {manhattanDistance && walkingTime && (
        <div className="distance-info">
          <p><strong>Distance:</strong> {manhattanDistance} miles</p>
          <p><strong>Est. Walking Time:</strong> {walkingTime} minutes</p>
          <button 
            className="save-route-button" 
            onClick={saveRoute}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Route as Favorite'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DirectionsMenu