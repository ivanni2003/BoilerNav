import React, { useState, useEffect } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const IndoorRouteMenu = ({ 
  start, 
  destination, 
  route, 
  distance,
  time,
  user,
  showNotification,
  building
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [globalPrivacySetting, setGlobalPrivacySetting] = useState(true);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingRoute, setExistingRoute] = useState(null);

  useEffect(() => {
    setHasBeenSaved(false);
  }, [start, destination]);

  useEffect(() => {
    const fetchGlobalPrivacySetting = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:3001/api/routes/${user.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data.length > 0) {
            setGlobalPrivacySetting(response.data[0].isPublic);
          }
        } catch (error) {
          console.error('Error fetching routes:', error);
        }
      }
    };

    fetchGlobalPrivacySetting();
  }, [user]);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!user || !start || !destination) return;
      setIsChecking(true);
      try {
        const response = await axios.post(
          'http://localhost:3001/api/routes/check-duplicate',
          {
            userId: user.id,
            startLocation: {
              name: start.properties.RoomName,
              lat: start.properties.id,
              lon: 0,
              floor: start.properties.Floor
            },
            endLocation: {
              name: destination.properties.RoomName,
              lat: destination.properties.id,
              lon: 0,
              floor: destination.properties.Floor
            },
            travelMode: 'indoor',
            buildingId: building.id
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );

        setIsDuplicate(response.data.isDuplicate);
        setExistingRoute(response.data.existingRoute);
      } catch (error) {
        console.error('Error checking for duplicate route:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkDuplicate();
  }, [start, destination, user, building.id]);

  const saveRoute = async () => {
    if (!user) {
      showNotification('Please log in to save routes', 'error');
      return;
    }
  
    if (isDuplicate) {
      showNotification('This route is already saved in your favorites', 'info');
      return;
    }
  
    setIsSaving(true);
    try {
      // Validate required data
      if (!start?.properties?.RoomName || !destination?.properties?.RoomName) {
        throw new Error('Invalid start or destination room data');
      }
  
      if (!distance || !time) {
        throw new Error('Distance and time are required');
      }
  
      const routeData = {
        userId: user.id,
        startLocation: {
          name: start.properties.RoomName,
          lat: parseFloat(start.properties.id) || 0,
          lon: 0,
          floor: parseInt(start.properties.Floor) || 0
        },
        endLocation: {
          name: destination.properties.RoomName,
          lat: parseFloat(destination.properties.id) || 0,
          lon: 0,
          floor: parseInt(destination.properties.Floor) || 0
        },
        distance: parseFloat(distance),
        duration: parseFloat(time),
        travelMode: 'indoor',
        polyline: route.map(point => ({
          lat: 0,
          lon: 0,
          x: parseFloat(point.x),
          y: parseFloat(point.y),
          floor: parseInt(point.floor)
        })),
        isPublic: globalPrivacySetting,
        buildingId: building.id
      };
  
      console.log('Sending route data:', routeData);
  
      const response = await axios.post('http://localhost:3001/api/routes', routeData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
  
      showNotification('Indoor route saved successfully!', 'success');
      setHasBeenSaved(true);
      setIsDuplicate(true);
      setExistingRoute(response.data);
    } catch (error) {
      console.error('Error saving route:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred while saving the route';
      showNotification(`Failed to save route: ${errorMessage}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="directions-menu indoor-route-menu" style={{
      position: 'relative',
      top: '180px', // Position below the search bars
      right: '10px',
      width: '250px',
      zIndex: 1000,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      padding: '16px'
    }}>
      <div className="distance-info">
        <p><strong>Distance:</strong> {distance} meters</p>
        <p><strong>Est. Walking Time:</strong> {time} minutes</p>
      </div>
      
      {user && isDuplicate && (
        <div className="duplicate-route-notice">
          <AlertCircle size={16} />
          <span>This route is already in your favorites</span>
        </div>
      )}

      {user && !isDuplicate && (
        <div className="privacy-info">
          <div className="privacy-status">
            {globalPrivacySetting ? (
              <><Unlock size={16} /> Route will be saved as Public</>
            ) : (
              <><Lock size={16} /> Route will be saved as Private</>
            )}
          </div>
        </div>
      )}

      <button
        className={`save-route-button ${isDuplicate ? 'duplicate' : ''}`}
        onClick={saveRoute}
        disabled={isSaving || isDuplicate || isChecking}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: '10px',
          backgroundColor: isDuplicate ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isDuplicate ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
      >
        {isChecking ? 'Checking...' :
         isSaving ? 'Saving...' :
         isDuplicate ? 'Route Already Saved' :
         'Save Indoor Route'}
      </button>
    </div>
  );
};

export default IndoorRouteMenu;