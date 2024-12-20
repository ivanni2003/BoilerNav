import React, { useState, useEffect } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './DirectionsMenu.css';

const baseURL = import.meta.env.VITE_API_URL;

const DirectionsMenu = ({
  start,
  destination,
  closeDirections,
  handleRouting,
  manhattanDistance,
  travelTime,
  selectedMode,
  user,
  polylineCoordinates,
  showNotification,
  onViewSavedRoute,
  updatePublicRoutes,
  isInterior,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [globalPrivacySetting, setGlobalPrivacySetting] = useState(true);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingRoute, setExistingRoute] = useState(null);
  const [savedRouteStartName, setSavedRouteStartName] = useState('');

  // Create a unique identifier for the current route
  const routeIdentifier = JSON.stringify({
    start,
    destination: destination?.buildingPosition,
    selectedMode
  });

  useEffect(() => {
    // Reset hasBeenSaved when route changes
    setHasBeenSaved(false);
  }, [routeIdentifier]);

  // Fetch the global privacy setting when component mounts
  useEffect(() => {
    const fetchGlobalPrivacySetting = async () => {
      if (user && !isInterior) {
        try {
          const response = await axios.get(`${baseURL}/api/routes/${user.id}`, {
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
      if (!user || !start || !destination || isInterior) return;
      setIsChecking(true);
      try {
        const response = await axios.post(
          `${baseURL}/api/routes/check-duplicate`,
          {
            userId: user.id,
            startLocation: {
              lat: start[0],
              lon: start[1]
            },
            endLocation: {
              lat: destination.buildingPosition.lat,
              lon: destination.buildingPosition.lon
            },
            travelMode: selectedMode
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
  }, [start, destination, selectedMode, user]);

  // Modified close handler to wrap the original closeDirections
  const handleClose = () => {
    // Reset the saved state
    setHasBeenSaved(false);
    // Call the original close function
    closeDirections();
  };

  const saveRoute = async (e) => {
    e.preventDefault()

    if (!user) {
      showNotification('Please log in to save routes', 'error');
      return;
    }

    if (savedRouteStartName.length == 0) {
      showNotification('Please enter a descriptive start location to save this route', 'error');
      return;
    }

    if (isDuplicate) {
      showNotification('This route is already saved in your favorites', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const routeData = {
        userId: user.id,
        startLocation: {
          lat: start[0],
          lon: start[1],
          name: savedRouteStartName
        },
        endLocation: {
          lat: destination.buildingPosition.lat,
          lon: destination.buildingPosition.lon,
          name: destination.properties?.RoomName || destination.tags?.name || 'Unnamed Destination'
        },
        distance: manhattanDistance,
        duration: travelTime,
        travelMode: selectedMode,
        polyline: polylineCoordinates.map(coord => ({ lat: coord[0], lon: coord[1] })),
        isPublic: globalPrivacySetting
      };

      const response = await axios.post(`${baseURL}/api/routes`, routeData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      showNotification('Route saved successfully!', 'success');
      setHasBeenSaved(true);
      setIsDuplicate(true);
      setExistingRoute(response.data);
      updatePublicRoutes();
    } catch (error) {
      if (error.response?.status === 409) {
        showNotification('This route is already saved in your favorites', 'info');
        setIsDuplicate(true);
        setExistingRoute(error.response.data.existingRoute);
      } else {
        console.error('Error saving route:', error);
        showNotification('Failed to save route. Please try again.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleViewRoute = () => {
    if (existingRoute) {
      onViewSavedRoute(existingRoute);
      closeDirections();
    }
  };

  const handleSavedRouteStartChange = (e) => {
    setSavedRouteStartName(e.target.value);
  }

  const CopyRoute = () => {
    var text = "http://localhost:5173?lat=" + destination.buildingPosition.lat + "&lon=" + destination.buildingPosition.lon + "&nam=" + destination.tags.name;
    navigator.clipboard.writeText(text).then(function() {
      showNotification('Copied to Clipboard', 'info');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
    if (user != null) {
      axios.post(`${baseURL}/api/ShareRouteEmail`, {
        email: user.email,
        resetLink: text
      })
        .then(response => {
          console.log('Email sent successfully', response.data);  // Response from server
          showNotification('Email sent successfully', 'info');
        })
        .catch(error => {
          console.error('Error sending email:', error.response || error.message);
          if (error.response) {
            // Server responded with a status code that falls out of the range of 2xx
            console.error('Server response:', error.response.data);
          } else {
            // Something went wrong with the request itself
            console.error('Request error:', error.message);
          }
          showNotification('Error sending email', 'error');
        });
    }
  }

  const transportation_string = selectedMode === "bike" ? "Biking" : 
                              selectedMode === "bus" ? "Busing" : 
                              "Walking";

  return (
    <div className="directions-menu">
      <input
        className="input-field"
        type="text"
        value={start?.properties?.RoomName || "Current Location"}
        placeholder="Start Location"
        readOnly
      />
      <input
        className="input-field"
        type="text"
        value={destination ? destination.properties?.RoomName || destination.tags?.name : ""}
        placeholder="Destination"
        readOnly
      />
      <div className="button-container">
        <button className="directions-button" onClick={handleClose}>Close</button>
        <button className="directions-button" onClick={CopyRoute}>Copy Route</button>
        <button className="directions-button" onClick={handleRouting}>Go</button>
      </div>
      {!isInterior && manhattanDistance && travelTime && (
        <div className="route-save-section">
          <div className="distance-info">
            <p><strong>Distance:</strong> {manhattanDistance} miles</p>
            <p><strong>Est. {selectedMode === "bike" ? "Biking" : 
                          selectedMode === "bus" ? "Busing" : 
                          "Walking"} Time:</strong> {travelTime} minutes</p>
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
          <form onSubmit={saveRoute}>
            <div>
              <label>
                <input className='save-route-input' type="text" placeholder="Enter Start Location for Saved Route" onChange={handleSavedRouteStartChange} value={savedRouteStartName}/>
              </label>  
            </div>
              <div>
              <button
                className="save-route-button"
                disabled={isSaving || isDuplicate || isChecking}
              >
                {isChecking ? 'Checking...' :
                isSaving ? 'Saving...' :
                isDuplicate ? 'Route Already Saved' :
                'Save Route as Favorite'}
          </button>
              </div>
          </form>
          
        </div>
      )}
    </div>
  );
};

export default DirectionsMenu;