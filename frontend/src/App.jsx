import { useState, useEffect, useCallback } from 'react'
import './App.css'
import axios from 'axios'
import logoImage from './img/icon.png'
import CreateAccount from './components/CreateAccount'
import Login from './components/Login'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import DirectionsMenu from './components/DirectionsMenu'
import Notification from './components/Notification'
import Profile from './components/Profile'

const baseURL = 'http://localhost:3001'

function App() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  /* may or may need need these */
  const [nodes, setNodes] = useState([]);
  const [ways, setWays] = useState([]);
  const [relations, setRelations] = useState([]);

  const [buildings, setBuildings] = useState([])

  const [latitude, setLatitude] = useState(40.4274);
  const [longitude, setLongitude] = useState(-86.9132);
  const [zoom, setZoom] = useState(15)
  const [notification, setNotification] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null); // Store accuracy
  const [heading, setHeading] = useState(null);
  const [altitude, setAltitude] = useState(null);

  const [activeMenu, setActiveMenu] = useState('search');
  const [start, setStart] = useState(null)
  const [destination, setDestination] = useState(null)
  const [polylineCoordinates, setPolylinecoordinates] = useState([]);
  const addCoordinate = (newCoordinate) => {
    setPolylineCoordinates(prevCoordinates => [
      ...prevCoordinates, // Keep the existing coordinates
      newCoordinate       // Add the new coordinate to the array
    ]);
  };
  const clearCoordinate = () => {
    setPolylinecoordinates([]);
  }
  const removeFirstCoordinate = () => {
    setPolylineCoordinates(prevCoordinates => prevCoordinates.slice(1)); // Remove the first element
  };

  const fetchBuildings = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/ways/buildings`);
        setBuildings(response.data); 
      } catch (error) {
        console.log(error); 
      }
  };

  const fetchFavoriteLocations = useCallback(async (userId, token) => {
    setIsLoadingFavorites(true);
    try {
      const response = await axios.get(`${baseURL}/api/users/${userId}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavoriteLocations(response.data);
    } catch (error) {
      console.error('Error fetching favorite locations:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {

    // Fetch buildings only when showLogin is false
    if (!showLogin) {
      fetchBuildings();
    }

    // Geolocation watching
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, altitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setAccuracy(accuracy);
        setAltitude(altitude);

        if (heading !== null) {
          setHeading(heading);
        }
      },
      (err) => {
        setUserLocation([40.4274, -86.9132])
        console.error(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // Cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [showLogin]); // Dependency array includes showLogin

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${baseURL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      await fetchFavoriteLocations(response.data.id, token);
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
    }
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleCreateAccount = () => {
    setShowCreateAccount(true);
    setShowLogin(false);
    setIsPopupOpen(false);
  };

  const handleCloseCreateAccount = () => {
    setShowCreateAccount(false);
  };

  const handleViewProfile = () => {
    setShowProfile(true);
    setIsPopupOpen(false);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  const handleLogin = () => {
    setShowLogin(true);
    setShowCreateAccount(false);
    setIsPopupOpen(false);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };


  const handleLogout = () => {
    setUser(null);
    setFavoriteLocations([]);
    localStorage.removeItem('token');
    setIsPopupOpen(false);
    showNotification('You have been logged out.', 'info');
  };

  const handleTitleClick = () => {
    setShowCreateAccount(false);
    setShowLogin(false);
    setShowProfile(false);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleMapUpdate = (latitude, longitude, zoom) => { // Use this to update map centering 
    setLatitude(latitude);
    setLongitude(longitude);
    setZoom(zoom)
  };

  const handleCreateSuccess = (userData) => {
    setUser({
      id: userData.id,
      name: userData.fullName,  
      username: userData.username,
      email: userData.email,
      major: userData.major,
      affiliation: userData.affiliation
    });
    localStorage.setItem('token', userData.token);  // If your API returns a token on account creation
    setShowCreateAccount(false);
    showNotification('Account created successfully!', 'success');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    showNotification('Profile updated successfully!', 'success');
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    await fetchFavoriteLocations(userData.id, userData.token);
    setShowLogin(false);
    showNotification('Successfully logged in!', 'success');
  };

  const isBuildingFavorite = useCallback((buildingId) => {
    return favoriteLocations.some(fav => fav.buildingId === buildingId);
  }, [favoriteLocations]);

  const handleFavoriteToggle = useCallback((buildingId, isFavorite, buildingData) => {
    setFavoriteLocations(prevFavorites => {
      if (isFavorite) {
        return [...prevFavorites, buildingData];
      } else {
        return prevFavorites.filter(fav => fav.buildingId !== buildingId);
      }
    });
  }, []);


  const handleSaveFavoriteRoute = (building) => {
    console.log(building)
    // add functionality to save route
    // selected building is the parameter
  }

  const handleViewIndoorPlan = (building) => {
    console.log(building)
    // add functionality for user to select floor + rendering
    // selected building is the parameter
  }

  const handleGetDirections = (building) => {
    setStart(userLocation)
    setDestination(building)
    setActiveMenu('directions');
}

  const handleRouting = async (start, destination) => {
    console.log("Start: ", start); // list of lat and lon
    console.log("Destination: ", destination); // building way
    // implement routing logic
    try {
      const buildingPos = destination.buildingPosition;
      const routeQuery = `${baseURL}/api/ways/route/${start[0]}/${start[1]}/${buildingPos.lat}/${buildingPos.lon}`;
      const routeNodesResponse = await axios.get(`${routeQuery}`);
      console.log("Route API Response:", routeNodesResponse);
      const routeNodes = routeNodesResponse.data.nodes;
      console.log(routeNodes);
      
      const nodeCoordinates = await Promise.all(routeNodes.map(async (nodeId) => {
        const nodeResponse = await axios.get(`${nodeAPI}/${nodeId}`); // Assuming your node API fetches node lat/lon by ID
        const { lat, lon } = nodeResponse.data;
        return [lat, lon];
      }));

      // We use the polyline lib to display the route line.
      setPolylineCoordinates(nodeCoordinates);

    } catch (error) {
      console.error("Error fetching route:", error);
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <button className="user-button" onClick={togglePopup}>
          {user && user.name && user.name.length > 0 ? (
            <span className="user-initial">{user.name[0].toUpperCase()}</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          )}
        </button>
        {isPopupOpen && (
          <div className="popup">
            {user ? (
              <>
                <button onClick={handleViewProfile}>View Profile</button>
                <button onClick={handleLogout}>Log Out</button>
              </>
            ) : (
              <>
                <button onClick={handleCreateAccount}>Create Account</button>
                <button onClick={handleLogin}>Log In</button>
              </>
            )}
          </div>
        )}
        <div className="logo-title" onClick={handleTitleClick} style={{cursor: 'pointer'}}>
          <img src={logoImage} alt="BoilerNav Logo" className="logo" />
          <h1>BoilerNav</h1>
        </div>
      </header>
      <div className="content">
        {showCreateAccount ? (
          <CreateAccount onClose={handleCloseCreateAccount} onCreateSuccess={handleCreateSuccess} showNotification={showNotification}/>
        ) : showLogin ? (
          <Login onClose={handleCloseLogin} onLoginSuccess={handleLoginSuccess} />
        ) : showProfile ? (
          <Profile user={user} onClose={handleCloseProfile} onUpdateUser={handleUpdateUser} onLogout={handleLogout}/>
        ) : (
          <div className="map-content">
            <div className="map-container">
              <Map 
                latitude={latitude} 
                longitude={longitude} 
                zoom={zoom} 
                buildings={buildings} 
                userLocation={userLocation} 
                accuracy={accuracy} 
                altitude={altitude} 
                heading={heading}
                viewIndoorPlan={handleViewIndoorPlan}
                getDirections={handleGetDirections}
                user={user}
                showNotification={showNotification}
                favoriteLocations={favoriteLocations}
                isLoadingFavorites={isLoadingFavorites}
                onFavoriteToggle={handleFavoriteToggle}
                polylineCoordinates={polylineCoordinates}
              />
              {activeMenu === 'directions' ? (
                <div className="directions-menu">
                  <DirectionsMenu
                    items={buildings} // Pass the items (buildings) to the DirectionsMenu
                    updateMap={handleMapUpdate} // Pass the updateMap function
                    start={userLocation}
                    destination={destination}
                    closeDirections={() => setActiveMenu('search')} // Function to close directions
                    handleRouting={handleRouting}
                  />
              </div>
              ) : (
                <div className="search-container">
              <SearchBar items={buildings} updateMap={handleMapUpdate} start={null} destination={null} />
              </div>
              )}
            </div>
          </div>
        )}
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );

}
export default App;
