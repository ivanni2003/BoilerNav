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
import TransportationMode from './components/TransportationMode';
import ErrorBoundary from './components/ErrorBoundary';
import SavedLocationsList from './components/SavedLocationsList';
import MostPopular from './components/MostPopular'
import BurgerMenu from './components/BurgerMenu';
import Tutorial from './components/Tutorial';
import ShareRoute from './components/ShareRoute';
import Schedule from './components/Schedule'
import { Menu, Share } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL;

function App() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedSavedRoute, setSelectedSavedRoute] = useState(null);
  const [savedLocationsVersion, setSavedLocationsVersion] = useState(0);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [floorPlans, setFloorPlans] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [buildings, setBuildings] = useState([])
  const [publicRoutes, setPublicRoutes] = useState([])
  const [topRoutes, setTopRoutes] = useState([])

  const [latitude, setLatitude] = useState(40.4274);
  const [longitude, setLongitude] = useState(-86.9132);
  const [zoom, setZoom] = useState(15)
  const [notification, setNotification] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null); // Store accuracy
  const [heading, setHeading] = useState(null);
  const [altitude, setAltitude] = useState(null);

  const [activeView, setActiveView] = useState('map');
  const [activeMenu, setActiveMenu] = useState('search');
  const [start, setStart] = useState(null)
  const [destination, setDestination] = useState(null)
  const [polylineCoordinates, setPolylineCoordinates] = useState([]);
  const [indoorStart, setIndoorStart] = useState(null);
  const [indoorDestination, setIndoorDestination] = useState(null);

  const [selectedMode, setSelectedMode] = useState('footpath'); // footpath route-type default

  const [isRerouteEnabled, setIsRerouteEnabled] = useState(true);
  const [isBikeRacksVisible, setIsBikeRacksVisible] = useState(false);

  const [schedule, setSchedule] = useState([]);
  const [isStartBuilding, setIsStartBuilding] = useState(false);
  const [indexInsert, setIndexInsert] = useState(1);
  const [isReplacing, setIsReplacing] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [nextScheduleBuilding, setNextScheduleBuilding] = useState(null);
  const [isScheduleBuildingSelect, setIsScheduleBuildingSelect] = useState(false);
  const [isScheduleRouting, setIsScheduleRouting] = useState(false);

  const mapOptions = {
    isRerouteEnabled: isRerouteEnabled,
    setIsRerouteEnabled: setIsRerouteEnabled,
    isBikeRacksVisible: isBikeRacksVisible,
    setIsBikeRacksVisible: setIsBikeRacksVisible
  };

  const handleScheduleClick = () => {
    setShowSchedule(true);
  };

  const handleScheduleBuildingSelect = (building) => {
    setIsScheduleBuildingSelect(false);
    setShowSchedule(true);
    setNextScheduleBuilding(building);
  };

  const handleSelectMode = (mode) => {
    setSelectedMode(mode); // Update the selected mode
  };

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

  const fetchPublicRoutes = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/routes/public/outdoor`);
      setPublicRoutes(response.data); 
    } catch (error) {
      console.log(error); 
    }
  };

  const fetchTopRoutes = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/routes/public/outdoor/topRoutes`);
      setTopRoutes(response.data)
    } catch (error) {
      console.log(error); 
    }
  }

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

  const validatePolylineCoordinates = (coordinates) => {
    if (!Array.isArray(coordinates)) return [];
    return coordinates.filter(coord => 
      Array.isArray(coord) && 
      coord.length === 2 && 
      typeof coord[0] === 'number' && 
      typeof coord[1] === 'number'
    );
  };

  const handleViewIndoorPlan = async (building) => {
    setSelectedBuilding(building);
    if (building.floorPlans && building.floorPlans.length > 0) {
      setFloorPlans(building.floorPlans);
      setShowFloorPlan(true);
    } else {
      try {
        const response = await axios.get(`${baseURL}/api/floorplans/building/${building.id}`);
        if (building.tags.name == null) {
          showNotification('No floor plans available for this building', 'info');
        }
        else if (response.data && response.data.length > 0) {
          setFloorPlans(response.data);
          setShowFloorPlan(true);
        } else {
          setFloorPlans(null);
          setShowFloorPlan(true);
        }
      } catch (error) {
        console.error('Error fetching floor plans:', error);
        showNotification('Error fetching floor plans', 'error');
      }
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Add a class to the main content wrapper when menu is open
      document.querySelector('.content').style.filter = 'blur(4px)';
      document.querySelector('.content').style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.querySelector('.content').style.filter = 'none';
      document.querySelector('.content').style.pointerEvents = 'auto';
    }
  
    return () => {
      document.body.style.overflow = 'unset';
      document.querySelector('.content').style.filter = 'none';
      document.querySelector('.content').style.pointerEvents = 'auto';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleOpenFloorPlan = async (event) => {
      const { building, route, startLocationId, endLocationId } = event.detail;
      
      // Set start and destination for the indoor route
      const start = {
        properties: {
          id: parseInt(startLocationId),
          RoomName: route.startLocation.name,
          Floor: route.startLocation.floor
        }
      };
      
      const destination = {
        properties: {
          id: parseInt(endLocationId),
          RoomName: route.endLocation.name,
          Floor: route.endLocation.floor
        }
      };

      setIndoorStart(start);
      setIndoorDestination(destination);
      await handleViewIndoorPlan(building);
    };

    window.addEventListener('openFloorPlan', handleOpenFloorPlan);
    return () => {
      window.removeEventListener('openFloorPlan', handleOpenFloorPlan);
    };
  }, []);

  
  const calculateDistanceFromRoute = (userLocation, polylineCoordinates) => {
    if (userLocation === null || polylineCoordinates === null || polylineCoordinates.length === 0) {
      return null;
    }
    const userLat = userLocation[0];
    const userLon = userLocation[1];
    let minDistance = Infinity;
    for (let i = 0; i < polylineCoordinates.length; i++) {
      const routeLat = polylineCoordinates[i][0];
      const routeLon = polylineCoordinates[i][1];
      const distance = ((userLat - routeLat) * 111111) ** 2 + ((userLon - routeLon) * 111111 * Math.cos(userLat)) ** 2;
      minDistance = Math.min(minDistance, distance);
    }
    return Math.sqrt(minDistance);
  };

  const clearRoute = () => {
    setPolylineCoordinates([]);
    setStart(null);
    setDestination(null);
    setRouteInfo({ manhattanDistance: null, travelTime: null });
    setSelectedSavedRoute(null);
  };

  const handleViewSavedRoute = (route) => {
    clearRoute();
  console.log('Raw saved route:', route);
  
  if (!route || !Array.isArray(route.polyline) || route.polyline.length < 2) {
    console.error('Invalid route structure:', route);
    showNotification('Unable to display route: Invalid route data', 'error');
    return;
  }

  // Transform polyline data
  const transformedPolyline = route.polyline.map((point, index) => {
    if (point && typeof point.lat === 'number' && typeof point.lon === 'number') {
      return [point.lat, point.lon];
    } else if (Array.isArray(point) && point.length === 2) {
      return point;
    } else if (point && point._id) {
      console.warn(`Coordinate at index ${index} is malformed:`, point);
      return null;
    }
    console.warn(`Invalid coordinate at index ${index}:`, point);
    return null;
  }).filter(point => point !== null);

  console.log('Transformed polyline:', transformedPolyline);

  if (transformedPolyline.length < 2) {
    console.error('Insufficient valid coordinates after transformation');
    showNotification('Unable to display route: Insufficient valid coordinates', 'error');
    return;
  }

  const transformedRoute = {
    ...route,
    polyline: transformedPolyline
  };

  setSelectedSavedRoute(transformedRoute);
  setShowProfile(false);
  //setIsMapView(true);
  
  // Use the first point of the polyline for initial map centering
  handleMapUpdate(transformedPolyline[0][0], transformedPolyline[0][1], 15);
};

  useEffect(() => {   // removes scrollbar within main menu
    document.body.style.overflow = 'hidden';
  }, []); 

  useEffect(() => {
    const handleOpenFloorPlan = async (event) => {
      const { building, route, startLocationId, endLocationId } = event.detail;
      
      // Set the selected building and show floor plan
      setSelectedBuilding(building);
      setShowFloorPlan(true);
      
      // Set the start and destination for the indoor route
      setStart({
        properties: {
          id: startLocationId,
          RoomName: route.startLocation.name,
          Floor: route.startLocation.floor
        }
      });
      
      setDestination({
        properties: {
          id: endLocationId,
          RoomName: route.endLocation.name,
          Floor: route.endLocation.floor
        }
      });
    };
  
    window.addEventListener('openFloorPlan', handleOpenFloorPlan);
    return () => {
      window.removeEventListener('openFloorPlan', handleOpenFloorPlan);
    };
  }, []);

  useEffect(() => {

    // Fetch buildings only when showLogin is false
    if (!showLogin) {
      fetchBuildings();
      fetchPublicRoutes();
      fetchTopRoutes();
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
        //setUserLocation([40.4274, -86.9132])
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

  // Check if the user needs to be rerouted if they are off course
  useEffect(() => {
    if (!isRerouteEnabled) return;
    if (isScheduleBuildingSelect) return;
    if (isScheduleRouting) return;
    const distanceFromRoute = calculateDistanceFromRoute(userLocation, polylineCoordinates);
    // console.log("Distance from route: ", distanceFromRoute);
    if (distanceFromRoute !== null && (distanceFromRoute > accuracy || distanceFromRoute > 100)) {
      console.log("User is off course. Rerouting...");
      // Re-route if user is off course
      showNotification('Rerouting...', 'info');
      setStart(userLocation);
      handleRouting();
    }
  }, [userLocation]);

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
    //setIsMapView(false);
  };

  const handleCloseCreateAccount = () => {
    setShowCreateAccount(false);
    //setIsMapView(true);   Not entirely sure these are needed, causing exceptions in console
  };

  const handleViewProfile = () => {
    setShowProfile(true);
    setIsPopupOpen(false);
    //setIsMapView(false);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    //setIsMapView(true);
  };

  const handleLogin = () => {
    setShowLogin(true);
    setShowCreateAccount(false);
    setIsPopupOpen(false);
    //setIsMapView(false);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
   // setIsMapView(true);
  };


  const handleLogout = () => {
    setUser(null);
    setFavoriteLocations([]);
    localStorage.removeItem('token');
    setIsPopupOpen(false);
    showNotification('You have been logged out.', 'info');
  };

  const handleTitleClick = () => {
    // Close all open components
    setShowCreateAccount(false);
    setShowLogin(false);
    setShowProfile(false);
    setIsPopupOpen(false);
    setShowSchedule(false);
    setIsScheduleBuildingSelect(false);
  
    // Reset map view
    setLatitude(40.4274); // Default latitude
    setLongitude(-86.9132); // Default longitude
    setZoom(15); // Default zoom level
  
    // Clear any active routes or selections
    setStart(null);
    setDestination(null);
    setPolylineCoordinates([]);
    setSelectedSavedRoute(null);

    clearRoute();
  
    // Reset menu state
    setActiveMenu('search');
  
    // Clear route info
    setRouteInfo({ manhattanDistance: null, walkingTime: null });
  
    // Reset transportation mode
    setSelectedMode('footpath');
  
    // Clear any notifications
    setNotification(null);
  
    // Ensure map view is shown
    //setIsMapView(true);
  
    // If you have any other state that needs resetting, do it here
  
    // Optionally, you could re-fetch buildings data if needed
    fetchBuildings();
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleMapUpdate = (newLatitude, newLongitude, newZoom) => {
    setLatitude(newLatitude !== undefined ? newLatitude : latitude);
    setLongitude(newLongitude !== undefined ? newLongitude : longitude);
    setZoom(newZoom !== undefined ? newZoom : zoom);
  };

  const handleCreateSuccess = (userData) => {
    setUser({
      id: userData.id,
      name: userData.fullName,  
      username: userData.username,
      email: userData.email,
      major: userData.major,
      affiliation: userData.affiliation,
      isElevated: userData.isElevated,
      isBanned: userData.isBanned,
      floorPlanRequests: userData.floorPlanRequests,
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
        setSavedLocationsVersion(prev => prev + 1); // Add this line
        return [...prevFavorites, buildingData];
      } else {
        setSavedLocationsVersion(prev => prev + 1); // Add this line
        return prevFavorites.filter(fav => fav.buildingId !== buildingId);
      }
    });
  }, []);

  const handleGetDirections = (building) => {  // get direction menu within popup
    clearRoute();
    setStart(userLocation)  // start is curr. location by default
    console.log("building:", building);
    setDestination(building)
    setActiveMenu('directions');
}

// manhattan distance formula. we will later convert to haversine distance for
// more accuracy.
const manhattanDistance = (coords1, coords2) => {
  const latDiff = Math.abs(coords1[0] - coords2[0]);
  const lonDiff = Math.abs(coords1[1] - coords2[1]);

  
  const latDistance = latDiff * 69;
  const lonDistance = lonDiff * 54;
  return latDistance + lonDistance;

};

// calculate total distance of a polyline (route)
const getTotalDistance = (polylineCoordinates) => {
  let totalDistance = 0;
  for (let i = 0; i < polylineCoordinates.length - 1; i++) {
    totalDistance += manhattanDistance(
      polylineCoordinates[i],
      polylineCoordinates[i + 1]
    );
  }
  return totalDistance; // miles
};

// get time in minutes to walk.
const getTravelTime = (distance, selectedMode) => {

  var travelSpeed = 3;
  if (selectedMode === "footpath") {
    travelSpeed = 3;
  }
  else if (selectedMode === "bike") {
    travelSpeed = 6;
  }
  else if (selectedMode === "bus") {
    travelSpeed = 8;
  }
  const time = distance / travelSpeed;
  const timeInMinutes = time * 60;

  return timeInMinutes;

};

  const [routeInfo, setRouteInfo] = useState({ manhattanDistance: null, travelTime: null });
  const handleRouting = async () => {
    setIsScheduleRouting(false);
    console.log("Start: ", start); // list of lat and lon
    console.log("Destination: ", destination); // building way
    // implement routing logic
    try {
      const buildingPos = destination.buildingPosition;
      
      // Query the route based on the method of transportation
      var routeQuery;
      console.log("transportation mode = ", selectedMode);
      if (selectedMode === "footpath") {
        routeQuery = `${baseURL}/api/ways/route/${start[0]}/${start[1]}/${buildingPos.lat}/${buildingPos.lon}`;
      }
      else if (selectedMode === "bike") {
        routeQuery = `${baseURL}/api/ways/bike-route/${start[0]}/${start[1]}/${buildingPos.lat}/${buildingPos.lon}`;
      }
      else if (selectedMode === "bus") {
        routeQuery = `${baseURL}/api/ways/bus-route/${start[0]}/${start[1]}/${buildingPos.lat}/${buildingPos.lon}`;
      }
      
      const routeNodesResponse = await axios.get(`${routeQuery}`);
      const routeNodes = routeNodesResponse.data;
      const nodeCoordinates = routeNodes.map(node => [node.latitude, node.longitude]);
      //console.log("Coordinates: ", nodeCoordinates);
      setPolylineCoordinates(nodeCoordinates);

      const totalManhattanDistance = getTotalDistance(nodeCoordinates);
      const travelTime = getTravelTime(totalManhattanDistance, selectedMode);
      //console.log(`total manhattan dist: ${totalManhattanDistance.toFixed(2)} miles`);
      //console.log(`est. walking Time: ${walkingTime.toFixed(2)} minutes`);
      
      setRouteInfo({
        manhattanDistance: totalManhattanDistance.toFixed(2),
        travelTime: travelTime.toFixed(2),
      });
    } catch (error) {
      console.error("Error fetching route:", error);
      setRouteInfo({ 
        manhattanDistance: null, 
        travelTime: null
       });
    }
  }

  const handleScheduleRouting = async () => {
    setIsScheduleRouting(true);
    setShowSchedule(false);
    setIsScheduleBuildingSelect(false);
    const buildingIds = schedule.map(building => building.id).join(',');
    if (buildingIds.length === 0) {
      showNotification('No buildings in schedule', 'error');
      return;
    }
    try {
      let response;
      if (isStartBuilding) {
        response = await axios.get(`${baseURL}/api/ways/schedule/${buildingIds}`);
      } else {
        response = await axios.get(`${baseURL}/api/ways/schedule-gps/${userLocation[0]}/${userLocation[1]}/${buildingIds}`);
      }
      const routeNodes = response.data;
      const nodeCoordinates = routeNodes.map(node => [node.latitude, node.longitude]);
      setPolylineCoordinates(nodeCoordinates);

      const totalManhattanDistance = getTotalDistance(nodeCoordinates);
      const travelTime = getTravelTime(totalManhattanDistance, selectedMode);
      //console.log(`total manhattan dist: ${totalManhattanDistance.toFixed(2)} miles`);
      //console.log(`est. walking Time: ${walkingTime.toFixed(2)} minutes`);

      setRouteInfo({
        manhattanDistance: totalManhattanDistance.toFixed(2),
        travelTime: travelTime.toFixed(2),
      });
    } catch (error) {
      console.error("Error fetching route:", error);
      setRouteInfo({ 
        manhattanDistance: null, 
        travelTime: null
      });
    }
  };

  const handleStartTutorial = () => {
    setIsMenuOpen(false);
    setIsTutorialActive(true);
    setTutorialStep(0);
  };
  
  const handleTutorialNext = () => {
    setTutorialStep(prev => prev + 1);
  };

  const handleLawsonClick = (building) => {
    handleViewIndoorPlan(building);
  };
  
  const handleCloseTutorial = () => {
    setIsTutorialActive(false);
    setTutorialStep(0);
  };

  const handleReset = () => {
    setLatitude(40.4274);
    setLongitude(-86.9132);
    setZoom(15);
    setStart(null);
    setDestination(null);
    setPolylineCoordinates([]);
    setSelectedSavedRoute(null);
    setShowFloorPlan(false);
    setIndoorStart(null);
    setIndoorDestination(null);
    setActiveMenu('search');
    setSelectedMode('footpath');
    setNotification(null);
    setShowProfile(false);
    setIsTutorialActive(false);
    setTutorialStep(0);
    fetchBuildings();
  };

  useEffect(() => {
    const transportationMode = document.querySelector('.transportation-mode');
    const searchContainer = document.querySelector('.search-container');
    
    if (isTutorialActive) {
      if (tutorialStep === 1) {
        // Transportation step
        if (transportationMode) {
          transportationMode.style.zIndex = '10000';
        }
      } else if (tutorialStep === 2) {
        // Search step
        if (searchContainer) {
          searchContainer.style.zIndex = '10000';
        }
      }
    } else {
      // Reset
      if (transportationMode) {
        transportationMode.style.zIndex = '';
      }
      if (searchContainer) {
        searchContainer.style.zIndex = '';
      }
    }
  
    return () => {
      if (transportationMode) {
        transportationMode.style.zIndex = '';
      }
      if (searchContainer) {
        searchContainer.style.zIndex = '';
      }
    };
  }, [isTutorialActive, tutorialStep]);

  const handleTutorialPrevious = () => {
    setTutorialStep(prev => prev - 1);
  };

  return (
    <ErrorBoundary>
    <div className="app-container">
    <header className="app-header" style={{ position: 'relative', zIndex: isMenuOpen ? 10000 : 1 }}>
        <div className="burger-menu">
          <BurgerMenu 
            user={user}
            onCreateAccount={handleCreateAccount}
            onLogin={handleLogin}
            onViewProfile={handleViewProfile}
            onLogout={handleLogout}
            isOpen={isMenuOpen}
            setIsOpen={setIsMenuOpen}
            onStartTutorial={handleStartTutorial}
          />
        </div>
        <div className="logo-title" onClick={handleTitleClick} style={{cursor: 'pointer'}}>
          <img src={logoImage} alt="BoilerNav Logo" className="logo" />
          <h1>BoilerNav</h1>
        </div>
      </header>
      <div className="content">
        {showCreateAccount ? (
          <CreateAccount onClose={handleCloseCreateAccount} onCreateSuccess={handleCreateSuccess} showNotification={showNotification}/>
        ) : showLogin ? (
          <Login onClose={handleCloseLogin} onLoginSuccess={handleLoginSuccess} showNotification={showNotification}/>
        ) : showProfile ? (
          <Profile 
            user={user} 
            onClose={handleCloseProfile} 
            onUpdateUser={handleUpdateUser} 
            onLogout={handleLogout}
            showNotification={showNotification}
            onViewSavedRoute={handleViewSavedRoute}
            updatePublicRoutes={fetchPublicRoutes}
          />
        ) : showSchedule && !isScheduleBuildingSelect ? (
          <Schedule
            nextBuilding={nextScheduleBuilding}
            setSelectBuilding={setIsScheduleBuildingSelect}
            setNextBuilding={setNextScheduleBuilding}
            isBuildingSelect={isScheduleBuildingSelect}
            onRouteSchedule={handleScheduleRouting}
            scheduleState={[schedule, setSchedule]}
            isStartBuildingState={[isStartBuilding, setIsStartBuilding]}
            indexInsertState={[indexInsert, setIndexInsert]}
            isReplacingState={[isReplacing, setIsReplacing]}
          />
        ) : (
        <div>
          <div className="map-content">
            <div className="map-container">
              {activeView == 'map' && (
              <>
                <Map 
              latitude={latitude} 
              longitude={longitude} 
              zoom={zoom} 
              buildings={buildings} 
              userLocation={userLocation} 
              accuracy={accuracy} 
              altitude={altitude} 
              heading={heading}
              getDirections={handleGetDirections}
              user={user}
              showNotification={showNotification}
              favoriteLocations={favoriteLocations}
              isLoadingFavorites={isLoadingFavorites}
              onFavoriteToggle={handleFavoriteToggle}
              polylineCoordinates={polylineCoordinates}
              selectedMode={selectedMode}
              selectedSavedRoute={selectedSavedRoute}
              handleMapUpdate={handleMapUpdate}
              mapOptions={mapOptions}
              showFloorPlan={showFloorPlan}
              setShowFloorPlan={setShowFloorPlan}
              selectedBuilding={selectedBuilding}
              setSelectedBuilding={setSelectedBuilding}
              floorPlans={floorPlans}
              setFloorPlans={setFloorPlans}
              handleViewIndoorPlan={handleViewIndoorPlan}
              indoorStart={indoorStart}
              indoorDestination={indoorDestination}
              setIndoorStart={setIndoorStart}
              setIndoorDestination={setIndoorDestination}
              handleTitleClick={handleTitleClick}
              handleScheduleClick={handleScheduleClick}
              handleScheduleBuildingSelect={handleScheduleBuildingSelect}
            />
            {<TransportationMode selectedMode={selectedMode} onSelectMode={handleSelectMode} />}
            {<MostPopular 
              items={topRoutes} 
              buttonName={'Popular Routes'} 
              markRoom={null} 
              viewSavedRoute={handleViewSavedRoute}/>
               }
            {notification && (
            <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
              />
            )}
            {activeMenu === 'directions' ? (
              <div className="directions-menu">
                <DirectionsMenu
                  start={userLocation}
                  destination={destination}
                  closeDirections={() => {
                  clearRoute();
                  setActiveMenu('search');
                }}
                handleRouting={handleRouting}
                manhattanDistance={routeInfo.manhattanDistance}
                travelTime={routeInfo.travelTime}
                selectedMode={selectedMode}
                user={user}
                polylineCoordinates={polylineCoordinates}
                showNotification={showNotification}
                onViewSavedRoute={(route) => {
                  handleViewSavedRoute(route);
                  setActiveMenu('search');
                }}
                updatePublicRoutes={fetchPublicRoutes}
              />
              </div>
           ) : (
            <div className="search-container">
            <div className="search-box">
              <SearchBar 
                items={publicRoutes} 
                updateMap={null} 
                markRooms={null} 
                viewSavedRoute={handleViewSavedRoute}
                searchStr={"Route"} 
              />
            </div>
            <div className="search-box">
              <SearchBar 
                items={buildings} 
                updateMap={handleMapUpdate} 
                markRooms={null} 
                viewSavedRoute={null}
                searchStr={"Destination"} 
              />
            </div>
            <SavedLocationsList 
              user={user}
              userLocation={userLocation}
              showNotification={showNotification}
              handleRouting={handleRouting}
              setStart={setStart}
              setDestination={setDestination}
              setActiveMenu={setActiveMenu}
              onLoginClick={() => {
                setShowLogin(true);
                setIsPopupOpen(false);
              }}
              version={savedLocationsVersion}
            />
          </div> 
              )}
            </>
          )}
        </div>
        </div>
      </div>
     )}
    </div>
    <Tutorial 
      isActive={isTutorialActive}
      currentStep={tutorialStep}
      onClose={handleCloseTutorial}
      onNext={handleTutorialNext}
      onPrevious={handleTutorialPrevious}
      onLawsonClick={handleLawsonClick}
      buildings={buildings}
      onCloseIndoorView={() => {
        setShowFloorPlan(false);
        setIndoorStart(null);
        setIndoorDestination(null);
      }}
      user={user}
      onViewProfile={handleViewProfile}
      onLogin={() => {
        setShowLogin(true);
        setIsTutorialActive(false);
      }}
      onCreateAccount={() => {
        setShowCreateAccount(true);
        setIsTutorialActive(false);
      }}
      onReset={handleReset}
    />
  </div>
  <ShareRoute 
      userLocation={userLocation}
      handleRouting={handleRouting}
      setStart={setStart}
      setDestination={setDestination}
      setActiveMenu={setActiveMenu}
    ></ShareRoute>
  </ErrorBoundary>
  );

}
export default App;
