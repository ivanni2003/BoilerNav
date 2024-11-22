import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigation, LogIn } from 'lucide-react';
import './SavedLocationsList.css';

const baseURL = process.env.REACT_APP_API_BASE_URL;

const SavedLocationsList = ({ 
  user, 
  userLocation, 
  showNotification, 
  handleRouting,
  setStart,
  setDestination,
  setActiveMenu,
  onLoginClick,
  version // Add this prop
}) => {
  const [savedLocations, setSavedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      fetchSavedLocations();
    } else {
      setSavedLocations([]);
    }
  }, [user, version]); // Add version to dependency array

  const fetchSavedLocations = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/users/${user.id}/favorites`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSavedLocations(response.data);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
      showNotification('Failed to fetch saved locations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationClick = (location) => {
    if (!userLocation) {
      showNotification('Please enable location services to use this feature', 'error');
      return;
    }

    const destinationBuilding = {
      buildingPosition: {
        lat: location.lat,
        lon: location.lon
      },
      tags: {
        name: location.name
      }
    };

    setStart(userLocation);
    setDestination(destinationBuilding);
    setActiveMenu('directions');
    handleRouting();
  };

  // Add a loading indicator for when locations are being refreshed
  const renderContent = () => {
    if (!user) {
      return (
        <div className="login-prompt">
          <LogIn className="login-icon" size={24} />
          <p>Log in to see your saved locations</p>
          <button className="login-button" onClick={onLoginClick}>
            Log In
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="loading-message">
          <p>Updating saved locations...</p>
        </div>
      );
    }

    if (savedLocations.length === 0) {
      return (
        <div className="empty-message">
          <p>You haven't saved any locations yet.</p>
          <p>Save a location by clicking the star icon in a building's popup.</p>
        </div>
      );
    }

    return savedLocations.map((location) => (
      <div
        key={location.buildingId}
        onClick={() => handleLocationClick(location)}
        className="saved-location-item"
      >
        <div className="location-info">
          <p className="location-name">{location.name}</p>
        </div>
        <Navigation className="location-icon" size={16} />
      </div>
    ));
  };

  return (
    <div className="saved-locations-container">
      <div className="saved-locations-header">
        <h3>Saved Locations</h3>
      </div>
      <div className="saved-locations-list">
        {renderContent()}
      </div>
    </div>
  );
};

export default SavedLocationsList;