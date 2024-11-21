import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import 'leaflet.heat';
import arrowIcon from '../img/up-arrow.png';
import Parking from './Parking'
import SearchBar from './SearchBar'
import BusStops from './BusStops'
import MapOptions from './MapOptions'
import DirectionsMenu from './DirectionsMenu'
import InteriorPopupContent from './InteriorPopupContent';
import IndoorRouteMenu from './IndoorRouteMenu';
import { v4 as uuid } from 'uuid'
import MostPopular from './MostPopular'
import SubmitFloorPlan from './SubmitFloorPlan';

import { MapContainer, TileLayer, CircleMarker, Marker, useMap, Polyline, Circle, Popup, useMapEvents } from 'react-leaflet';

const DEVICE_ID_KEY = 'boilernav-device-id'

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY) || ""
  if(!deviceId){
      deviceId = uuid()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

const baseURL = "http://localhost:3001";

const DEFAULT_LAT = 40.4237;
const DEFAULT_LON = -86.9212;
const DEFAULT_ZOOM = 15;

const MapEventHandler = ({ selectedSavedRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedSavedRoute && Array.isArray(selectedSavedRoute.polyline) && selectedSavedRoute.polyline.length > 1) {
      try {
        const bounds = L.latLngBounds(selectedSavedRoute.polyline);
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        } else {
          console.error('Invalid bounds for the route:', selectedSavedRoute.polyline);
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [selectedSavedRoute, map]);

  return null;
};


const FloorPlan = ({ startNode, endNode, rooms, setDistancetime, floorNumber, markedRoom, handleRoomClick, building}) => {
  const [pathD, setPathD] = useState('');

  useEffect(() => {
    const fetchPath = async () => {
      // If either startNode or endNode is null, clear the path
      if (!startNode || !endNode) {
        setPathD('');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/indoornav/path?building=${building.tags.name}&start=${startNode}&end=${endNode}`);
        const data = await response.json();

        if (data.route) {
          ///console.log("Path data received:", data.route);
          const avgMsRate = 1.3;
          const distance = (data.distance).toFixed(2);
          const time = ((distance / avgMsRate) / 60).toFixed(2);
          setDistancetime(distance, time);


          try {   // updating destination count of room
            const buildingName = building.tags.name.replace(' ', '')
            await axios.patch(`http://localhost:3001/api/indoordata/${buildingName}/${endNode}`)
          } catch (error) {
            console.log(error)
          }
      

          const floorMappings = { 'Basement': -1, '1': 0, '2': 1, '3': 2 };
          const roomFloor = floorMappings[floorNumber] ?? 0;
          let lastFloor = null;
          const dString = data.route.reduce((acc, { x, y, floor }) => {
            if (roomFloor === floor) {
              const command = lastFloor === floor ? `L ${x} ${y}` : `M ${x} ${y}`;
              lastFloor = floor;
              return `${acc} ${command}`;
            }
            return acc;
          }, '');

          //console.log("dString: ", dString);
          setPathD(dString);
        }
      } catch (error) {
        console.error("Failed to fetch path data:", error);
        setPathD('');
      }
    };

    fetchPath();
  }, [startNode, endNode, floorNumber]);

  return (
    <svg className="absolute-svg" width="100%" height="100%" viewBox="0 0 180 500" preserveAspectRatio="xMidYMid meet" >
      {pathD && <path fill="none" d={pathD} strokeWidth="1" stroke="black" />}
      {rooms.map((data) => (
        <circle
          key={data.room.properties.id}
          cx={data.x}
          cy={data.y}
          r="7"
          fill="lightgreen"
          stroke="black"
          strokeWidth="1"
          onClick={(event) => handleRoomClick(event, data)}
          style={{ cursor: 'pointer' }}
        />
      ))}
      {markedRoom && 
        <circle
          cx={markedRoom.x}
          cy={markedRoom.y}
          r="2"
          fill="red"
          stroke="black"
          strokeWidth="1"
          style={{ cursor: 'pointer' }}
        />
      }
    </svg>
  );
};

async function fetchHeatmapData() {
  try {
    const response = await fetch('http://localhost:3001/api/heatmap/heatmap-get'); 
    if (!response.ok) {
      throw new Error('Failed to fetch heatmap data');
    }
    const data = await response.json();
    //console.log('Heatmap Data:', data); // This will include lat, long, and intensity
    return data;
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
  }
}

async function fetchhistoricalHeatmapData() {
  try {
    const response = await fetch('http://localhost:3001/api/heatmap/historical-heatmap-get'); 
    if (!response.ok) {
      throw new Error('Failed to fetch heatmap data');
    }
    const data = await response.json();
    //console.log('Heatmap Data:', data); // This will include lat, long, and intensity
    return data;
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
  }
}



const MapViewUpdater = ({ latitude, longitude, zoom }) => {
  const map = useMap(); 
  const heatmapLayerRef = useRef(null);
  const historicalHeatmapLayerRef = useRef(null);

  let SouthWestCoords = [40.40815, -86.95308];
  let NorthEastCoords = [40.44628, -86.89712];
  let WL_Bounds = [SouthWestCoords, NorthEastCoords]; 
  map.setMaxBounds(WL_Bounds);
  map.setMinZoom(15);
  const heatData = [
    [40.42, -86.901, 4],
    [40.435, -86.92, 1],
    // more data points
  ];

  useEffect(() => {
    map.setView([latitude, longitude], zoom);
    
    // Remove existing heatmap layer if it exists
    async function updateHeatmap() {
      const heatmapData = await fetchHeatmapData();
      const historicalHeatmapData = await fetchhistoricalHeatmapData();
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
      if (historicalHeatmapLayerRef.current) {
        map.removeLayer(historicalHeatmapLayerRef.current);
      }

      // Convert data to Leaflet.heat format
      const heatData = heatmapData.map(({ lat, long, intensity }) => [lat, long, intensity]);
      const historicalHeatmapDataFormatted = historicalHeatmapData.map(({ lat, long, intensity }) => [lat, long, intensity]);

      // Add the new heatmap layer
      heatmapLayerRef.current = L.heatLayer(heatData, {
        radius: 20,
        blur: 10,
        maxZoom: 17,
      }).addTo(map);
      historicalHeatmapLayerRef.current = L.heatLayer(historicalHeatmapDataFormatted, {
        radius: 15, // Slightly smaller radius for historical data
        blur: 15,   // Slightly more blur for historical data
        maxZoom: 17,
        opacity: 0.5, // Reduced opacity to distinguish from the current layer
        gradient: {0: 'yellow', 0.5: 'orange', 1: 'red'}, // Optional gradient for styling
      }).addTo(map);
    }

    updateHeatmap();

    // Cleanup function to remove the heatmap layer when the component unmounts
    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
      if (historicalHeatmapLayerRef.current) {
        map.removeLayer(historicalHeatmapLayerRef.current);
      }
    };
  }, [latitude, longitude, zoom, map]); 

  return null;
};


const FloorPlanView = ({ 
  building, 
  floorPlans, 
  onClose, 
  user, 
  showNotification,
  initialStart,
  initialDestination,
  handleTitleClick
}) => {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(floorPlans && floorPlans.length > 0 ? floorPlans[0] : null);
  const [rooms, setRooms] = useState([])
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);
  const [markedRoom, setMarkedRoom] = useState(null);
  const imageRef = useRef(null); // Ref to access image dimensions
  const [showDirectionsMenu, setShowDirectionsMenu] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Store selected room data for DirectionsMenu
  const [showPopup, setShowPopup] = useState(false);
  const [route, setRoute] = useState(null);

  const [topRooms, setTopRooms] = useState([])

  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState(initialStart); // Initialize with prop
  const [destination, setDestination] = useState(initialDestination); // Initialize with prop

  // Inside the FloorPlanView component
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleUpdateClick = () => {
    if (!user) {
      showNotification('Please log in to submit an update request', 'error');
      return;
    }
    setShowPopup(false); // Close the room popup
    setShowUpdateForm(true); // Show the update form
  };

  function getDaysSinceJan1() {
    const now = new Date(); // Current date
    const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1 of the current year
    const diffInMilliseconds = now - startOfYear; // Difference in milliseconds
    const diffInDays =  1 + Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24)); // Convert to days
    return diffInDays;
}
  
  const handleReserveClick = (event, RoomName, building, user) => {
    console.log("building:", building);
    console.log("user: ", user);
    if (RoomName.indexOf(' ') == -1) {
      RoomName = RoomName;
    }
    else {
      RoomName = RoomName.substring(0, RoomName.indexOf(' '));
    }
    console.log(RoomName);
    const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // January is 0, December is 11
  const currentYear = currentDate.getFullYear();

  // Determine if the semester is Fall or Spring based on the current month
  let semester = "Fall";
  if (currentMonth >= 1 && currentMonth <= 5) {  // January to May
    semester = "Spring";
  }

  // Format the semester and year, e.g., "Fall2024"
  const term = `${semester}${currentYear}`;

    const name = building.tags.name;
    const matches = name.match(/\((.*?)\)/);
    const abbreviation = matches ? matches[1] : null;
    console.log(`Abbreviation: ${abbreviation}`);
    const start = "https://timetable.mypurdue.purdue.edu/Timetabling/gwt.jsp?page=availability#dates=" + getDaysSinceJan1() + "&rooms=flag%253AEvent+" + abbreviation + "+" + RoomName + "&term=" + term + "PWL";
    const latitude = building.buildingPosition.lat;
    const longitude = building.buildingPosition.lon;
    const route = "http://localhost:5173?lat=" + latitude + "&lon=" + longitude + "&nam=" + name;
    //window.location.href = start;
    window.open(start, "_blank", "noopener,noreferrer");
    if (user != null) {
      /*
      axios.post(`${baseURL}/api/ShareRouteEmail`, {
        email: user.email,
        resetLink: route
      });
      */
     sendRouteEmailtoSelf(route);
    }
    else {
      window.location.href=route;
    }
  };

  const sendRouteEmailtoSelf = (routeLink) => {
    if (user != null) {
        axios.post('http://localhost:3001/api/ShareRouteEmail', {
          email: user.email,
          resetLink: routeLink
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${baseURL}/api/indoordata/update-request`, {
        buildingName: building.tags.name,
        roomId: selectedRoom.room.properties.id,
        newRoomName: newRoomName,
        username: user ? user.username : 'Guest'
      });
      showNotification('Update request submitted successfully', 'success');
      setShowUpdateForm(false);
      setNewRoomName(''); // Clear the input field
    } catch (error) {
      console.error('Error submitting update request:', error);
      showNotification('Failed to submit update request', 'error');
    }
  };

  const clearRoute = () => {
    setStart(null);
    setDestination(null);
    setDistance(null);
    setTime(null);
    setShowDirectionsMenu(false);
    setRoute(null);
    setMarkedRoom(null);
  };

  const handleRoomClick = (event, room) => {
    setSelectedRoom(room);
    setShowPopup(true); // Show the popup
    setShowDirectionsMenu(true) //  show the directions Menu 

    // Get the bounding rectangle of the clicked element
    const rect = event.target.getBoundingClientRect();

    // Calculate the position relative to the floor-plan-content container
    const containerRect = imageRef.current.getBoundingClientRect();
    const x = rect.left - 100//- containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + rect.height / 2;

    setPopupPosition({ x, y });
  }

  useEffect(() => {
    if (initialStart && initialDestination) {
      setStart(initialStart);
      setDestination(initialDestination);
      setShowDirectionsMenu(true);
    }
  }, [initialStart, initialDestination]);

  const handleStartClick = () => {
    setStart(selectedRoom.room); // Set the selected room as the destination
    //console.log("Set start location for:", start);
    //console.log("Set destination location for:", destination);
    setShowPopup(false);
  };

  const handleDestinationClick = () => {
    setDestination(selectedRoom.room); // Set the selected room as the destination
   // console.log("Set start location for:", start);
   // console.log("Set destination location for:", destination);
    setShowPopup(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleCloseDirectionsMenu = () => {
    setShowDirectionsMenu(false);
    setSelectedRoom(null);
  };

  const handleClose = (e) => {
    e.preventDefault();
    clearRoute();
    onClose();
  };

  const convertFloorLevel = (selectedFloorPlan) => {   // assuming no ground level rn?
    if (selectedFloorPlan == "Basement") {
      return -1
    }
    else if (selectedFloorPlan == '1') {   // data misalignment, 0 -> 1 in Lawson
      return 0
    }
    else if (selectedFloorPlan == '2') {
      return 1
    }
    else if (selectedFloorPlan == '3') {
      return 2
    }
    else if (selectedFloorPlan == '4') {
      return 3
    }
    else if (selectedFloorPlan == '5') {
      return 4
    }
  }

  useEffect(() => {
    async function fetchAndSetRooms() {
      const buildingName = building.tags.name.replace(' ', '') // remove spaces in building name
      let indoorData = null

      try {
        const response = await axios.get(`${baseURL}/api/indoordata/${buildingName}`)
        indoorData = response.data
      } catch (error) {
        console.log(error)
      }

      const floorLevel = convertFloorLevel(selectedFloorPlan.floorNumber)
      console.log(floorLevel)

      try {
        const response = await axios.get(`${baseURL}/api/indoordata/${buildingName}/${floorLevel}/topRooms`)
        setTopRooms(response.data)
      } catch (error) {
        console.log(error)
      }

      // implement top rooms somewhere here using current floor, building name, etc.

      //console.log(response.data)
      //console.log(selectedFloorPlan)
      // Note: account for basement, 1, 2, 3, 4 for now. Need to change either floor plan or data to align and account for ground floors
      const filteredRooms = await Promise.all(
        indoorData.features
          .filter(room => {
            const roomFloor = room.properties.Floor;
            return (
              room.properties.Type === "Room" &&
              (
                (selectedFloorPlan.floorNumber === 'Basement' && roomFloor === -1) ||
                (selectedFloorPlan.floorNumber === '1' && roomFloor === 0) ||
                (selectedFloorPlan.floorNumber === '2' && roomFloor === 1) ||
                (selectedFloorPlan.floorNumber === '3' && roomFloor === 2) ||
                (selectedFloorPlan.floorNumber === '4' && roomFloor === 3)
              )
            );
          })
          .map(async room => {
            const roomName = room.properties.RoomName;

            // Fetch x, y position for each room
            const response = await axios.get(`${baseURL}/api/indoornav/position-from-name`, {
              params: { name: roomName }
            });
            const { x, y } = response.data;
            return { room: room, x: x, y: y };
          })
      );

      setRooms(filteredRooms);
    }
    fetchAndSetRooms()
    clearRoute()
  }, [selectedFloorPlan, building]);


  const handleRouteClose = () => {
    clearRoute();
  };
  
  const markRoom = async (item, usage) => { 
    let location = null
    if (usage == "search") {
      const response = await axios.get(`${baseURL}/api/indoornav/position-from-name`, {
        params: { name: item.room.properties.RoomName }
      });
      location = response.data
    }
    else {
      const response = await axios.get(`${baseURL}/api/indoornav/position-from-name`, {
        params: { name: item.properties.RoomName }
      });
      location = response.data
    }
    
    setMarkedRoom(location)
  }
  const setDistancetime = (newDistance, newTime) => {
    setDistance(newDistance);
    setTime(newTime);
  }

  return (
    <div className="floor-plan-fullscreen">
      <header className="app-header">
        <div 
          className="logo-title" 
          onClick={() => {
            onClose(); // Close floor plan view
            handleTitleClick(); // Reset to default state
          }} 
          style={{cursor: 'pointer'}}
        >
          <img src="/src/img/icon.png" alt="BoilerNav Logo" className="logo" />
          <h1>BoilerNav</h1>
        </div>
      </header>
      <div className='most-popular-rooms'>
      {<MostPopular 
              items={topRooms} 
              buttonName={'Most Popular Rooms'} 
              markRoom={markRoom} 
              viewSavedRoute={null}/> }
      </div>  
      <div className="floor-plan-search"> 
                <SearchBar items={rooms} updateMap={null} markRoom={markRoom} viewSavedRoute={null} searchStr={"Room"} />
                <div>
                  <br></br>
                  <br></br>
                  <br></br>
                  <br></br>
                  <br></br>
                  {/* <p>{distance !== null ? `Distance: ${distance} meters` : 'Distance not calculated'}</p>
                  <p>{time !== null ? `Time: ${time} minutes` : 'Time not calculated'}</p> */}
                </div>
      </div>

      <SubmitFloorPlan user={user} building={building} showNotification={showNotification}/>

      <div className="floor-plan-header">
        <select 
          value={selectedFloorPlan?.floorNumber ?? 0}
          onChange={(e) => setSelectedFloorPlan(floorPlans.find(fp => fp.floorNumber === e.target.value))}
        >
          {floorPlans && floorPlans.map(fp => (
            <option key={fp.floorNumber} value={fp.floorNumber}>
              Floor {fp.floorNumber}
            </option>

          ))}
        </select>
        <button onClick={onClose}>×</button>
      </div>
      <div className="floor-plan-content">
        <img ref={imageRef} src={selectedFloorPlan?.imageUrl ?? null} alt={selectedFloorPlan?.floorNumber ? `Floor ${selectedFloorPlan.floorNumber}` : 'No floor plan available'} />
        
        {/* Path handler for interior */}
         {/* need to pass the building over */}
         <FloorPlan 
          startNode={start?.properties?.id} 
          endNode={destination?.properties?.id} 
          rooms={rooms} 
          setDistancetime={setDistancetime} 
          floorNumber={selectedFloorPlan?.floorNumber ?? 0} 
          markedRoom={markedRoom} 
          handleRoomClick={handleRoomClick} 
          building={building}
        />
          {start && destination && distance && time && (
          <div className="floor-plan-directions">
            <IndoorRouteMenu
              start={start}
              destination={destination}
              route={rooms}
              distance={distance}
              time={time}
              user={user}
              showNotification={showNotification}
              building={building}
              closeDirections={handleRouteClose}
            />
          </div>
        )}

        {showPopup && selectedRoom && (
          <InteriorPopupContent
          roomName={selectedRoom.room.properties.RoomName}
          onStartClick={handleStartClick}
          onDestinationClick={handleDestinationClick}
          onUpdateClick={handleUpdateClick}
          onReserveClick={(e) => handleReserveClick(e, selectedRoom.room.properties.RoomName, building, user)}
          onClose={handleClosePopup}
          position={popupPosition}
          />
        )}
      </div>

      {showUpdateForm && (
        <div className="update-form-overlay">
          <div className="update-form">
            <h2>Request Interior Update</h2>
            <form onSubmit={handleUpdateSubmit}>
              <p><strong>Current Room Name:</strong> {selectedRoom.room.properties.RoomName}</p>
              <label>
                New Room Name:
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                />
              </label>
              <div className="form-buttons">
                <button type="submit">SUBMIT</button>
                <button type="button" onClick={() => setShowUpdateForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDirectionsMenu && selectedRoom && (
        <div className="floor-plan-directions-menu"> 
        <DirectionsMenu
          start={start} // Assuming current location for start
          destination={destination} // Pass selected room data as destination
          closeDirections={handleRouteClose}
          handleRouting={() => { /* Define the routing function if needed */ }}
          manhattanDistance={distance}
          travelTime={time}
          selectedMode="walking" // You can dynamically set this based on user choice
          user={{}} // Replace with actual user object if needed
          polylineCoordinates={[]}
          showNotification={(message, type) => alert(`${type}: ${message}`)}
          onViewSavedRoute={(route) => console.log('View saved route:', route)}
          updatePublicRoutes={() => console.log('Update public routes')}
          isInterior={true}
        /></div>
        
      )}

    </div> 
  );
};

const PopupContent = ({ building, viewIndoorPlan, getDirections, user, showNotification, favoriteLocations, isLoadingFavorites, onFavoriteToggle }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [floorPlans, setFloorPlans] = useState([]);

  useEffect(() => {
    // console.log('Building ID:', building.id);
    if (user && !isLoadingFavorites) {
      setIsFavorite(favoriteLocations.some(fav => fav.buildingId === building.id.toString()));
    } else {
      setIsFavorite(false);
    }
    if (building.floorPlans) {
      setFloorPlans(building.floorPlans);
    }
  }, [building.id, favoriteLocations, isLoadingFavorites, user, building]);

  if (showFloorPlan) {
    return <FloorPlanView building={building} floorPlans={floorPlans} onClose={() => setShowFloorPlan(false)} user={null} />;
  }

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
      <div className="popup-menu">
      <button className="popup-button" onClick={() => viewIndoorPlan(building)}>View Indoors</button>
      <button 
          className="popup-button"
          onClick={handleFavoriteToggle} 
          disabled={isUpdating}
        >
          {user
            ? (isUpdating 
                ? 'Updating...' 
                : (isFavorite ? 'Unsave from favorites' : 'Save as Favorite'))
            : 'Save as Favorite'}
        </button>
        <button className="popup-button"
        onClick={() => getDirections(building)}>Directions</button>
      </div>
    </div>
  );
};

const BikeRackPopupContent = ({ rack }) => {
  return (
    <div>
      <h2>Bike Rack</h2>
      {rack.tags && rack.tags.bicycle_parking && <p>Type: {rack.tags.bicycle_parking}</p>}
      {rack.tags && rack.tags.capacity && <p>Capacity: {rack.tags.capacity}</p>}
      {rack.tags && rack.tags.covered && <p>Covered: {rack.tags.covered}</p>}
      {rack.tags && rack.tags.fee && <p>Fee: {rack.tags.fee}</p>}
    </div>
  );
}

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

const BikeRacksRenderer = ({ bikeRacks, isBikeRacksVisible }) => {
  if (!isBikeRacksVisible) {
    return null;
  }
  const bikeRackPathOptions = {
    color: 'blue',
    fillColor: 'blue',
  };
  return bikeRacks.map((rack, index) => {
    let position;
    if (rack.buildingPosition) {
      position = [rack.buildingPosition.lat, rack.buildingPosition.lon];
    } else {
      position = [rack.lat, rack.lon];
    }
    return <CircleMarker
      key={index}
      center={position}
      radius={2}
      pathOptions={bikeRackPathOptions}
      >
      <Popup>
        <BikeRackPopupContent rack={rack} />
      </Popup>
    </CircleMarker>
  });
}

const DebugWaysRenderer = ({ ways, nodes }) => {
  ways = ways.filter((way) => {
    if (!way.tags) {
      return false;
    }
    if (way.tags.highway == "footway") {
      return true;
    }
    if (way.tags.highway == "path") {
      return true;
    }
    if (way.tags.footway) {
      return true;
    }
    return false;
  });
  return ways.map((way, index) => {
    const nodeIDs = way.nodes;
    const wayNodes = nodeIDs.map((nodeID) => {
      const node = nodes.find((node) => node.id === nodeID);
      if (!node) {
        // console.log(`Node with ID ${nodeID} not found`);
        return null;
      }
      return [node.lat, node.lon];
    });
    const filteredWayNodes = wayNodes.filter((node) => node !== null);
    return <Polyline key={index} positions={filteredWayNodes} color="red" />;
  });
};

const DebugNavWaysRenderer = ({ ways, nodes }) => {
  return ways.map((way, index) => {
    const nodeIDs = way.nodes;
    const wayNodes = nodeIDs.map((nodeID) => {
      const node = nodes.find((node) => node.id === nodeID);
      if (!node) {
        // console.log(`Node with ID ${nodeID} not found`);
        return null;
      }
      return [node.latitude, node.longitude];
    });
    const filteredWayNodes = wayNodes.filter((node) => node !== null);
    return <Polyline key={index} positions={filteredWayNodes} color="red" />;
  });
};

const DebugNodeGraphRenderer = ({ nodes }) => {
  // Nodes from nodeGraph follow this structure:
  // {
  //  id: Number,
  //  connectedNodes: [Number],
  //  latitude: Number,
  //  longitude: Number
  //  visited: boolean
  // }
  const lineList = [];
  nodes.forEach((node) => {
    const connectedNodes = node.connectedNodes.map((connectedNodeID) => {
      const connectedNode = nodes.find((node) => node.id === connectedNodeID);
      if (!connectedNode) {
        // console.log(`Node with ID ${connectedNodeID} not found`);
        return null;
      }
      return [connectedNode.latitude, connectedNode.longitude];
    });
    const filteredConnectedNodes = connectedNodes.filter((node) => node !== null);
    filteredConnectedNodes.forEach((connectedNode) => {
      lineList.push([[node.latitude, node.longitude], connectedNode]);
    });
  });
  return lineList.map((line, index) => {
      return <Polyline key={index} positions={line} color="red" />;
  });
};

const Map = ({ latitude,
  longitude,
  zoom,
  buildings,
  userLocation,
  accuracy,
  altitude,
  heading,
  getDirections,
  user,
  showNotification,
  favoriteLocations,
  isLoadingFavorites,
  onFavoriteToggle,
  selectedMode,
  polylineCoordinates,
  selectedSavedRoute, 
  handleMapUpdate,
  mapOptions,
  showFloorPlan,
  setShowFloorPlan,
  selectedBuilding,
  setSelectedBuilding,
  floorPlans,
  setFloorPlans,
  handleViewIndoorPlan,
  indoorStart,
  indoorDestination,
  setIndoorStart,
  setIndoorDestination,
  handleTitleClick }) => {
    const [parkingLots, setParkingLots] = useState([])
    const [busStops, setBusStops] = useState([]);
    const [bikeRacks, setBikeRacks] = useState([]);

    const markParkingLots = (lots) => {
      setParkingLots(lots)
    }

    const markBusStops = (stops) => {
      setBusStops(stops)
    }

  // DEBUG: Fetch navNodes and navWays for rendering
  // Comment out if not needed
  // const [navNodes, setNavNodes] = useState([]);
  // const [navWays, setNavWays] = useState([]);
  // const [nodeGraph, setNodeGraph] = useState([]);
  // useEffect(() => {
  //   const fetchNavNodes = async () => {
  //     try {
  //       const response = await axios.get(`${baseURL}/api/navNodes`);
  //       setNavNodes(response.data);
  //     } catch (error) {
  //       console.error('Error fetching navNodes:', error);
  //     }
  //   };
  //   const fetchNavWays = async () => {
  //     try {
  //       const response = await axios.get(`${baseURL}/api/navWays`);
  //       setNavWays(response.data);
  //     } catch (error) {
  //       console.error('Error fetching navWays:', error);
  //     }
  //   };
  //   const fetchNodeGraph = async () => {
  //     try {
  //       const response = await axios.get(`${baseURL}/api/navNodes/nodeGraph`);
  //       setNodeGraph(response.data);
  //     } catch (error) {
  //       console.error('Error fetching nodeGraph:', error);
  //     }
  //   };
  //   fetchNavNodes();
  //   fetchNavWays();
  //   fetchNodeGraph();
  // }, []);
  
  useEffect(() => {
    const fetchBikeRacks = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/ways/bikeracks`);
        setBikeRacks(response.data);
      } catch (error) {
        console.error('Error fetching bike racks:', error);
      }
    };
    fetchBikeRacks();
  }, []);

  useEffect(() => {
    const setheatmaplocation = async() => {
      try {
        //uid = 1; // Replace with dynamic UID if needed
        //const uid = Math.floor(Math.random() * 100);
        const uid = 34;
        //let id = machineIdSync();
        //console.log("uuid: ", id);
        const uuid = getDeviceId();
        console.log("uuid: ", uuid);
        console.log("uid: ", uid);
        const response = await axios.get(
          `${baseURL}/api/heatmap/heatmap-add?lat=${userLocation[0]}&long=${userLocation[1]}&uid=${uuid}`
        );
        console.log("Heatmap location updated:", response.data);
      } catch (error) {
        console.error("Error updating heatmap location:", error);
      }
    };
    if (userLocation)
      setheatmaplocation();
  }, [userLocation])

  var polylineColor = 'blue';
  if (selectedMode === "bike") {
    polylineColor = "green";
  }
  else if (selectedMode === "bus") {
    polylineColor = "red";
  }

  useEffect(() => {
    if (selectedMode === "bus") {
      const fetchBusStops = async () => {
        try {
          const response = await axios.get(`${baseURL}/api/nodes/bus-stops`);
          setBusStops(response.data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchBusStops();
    } else {
      setBusStops([]);
    }
  }, [selectedMode]);
  
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
    ? [userLocation, ...(polylineCoordinates || [])] // Add userLocation at the beginning
    : polylineCoordinates;


    // const handleViewIndoorPlan = async (building) => {
    //   setSelectedBuilding(building);
    //   if (building.floorPlans && building.floorPlans.length > 0) {
    //     setFloorPlans(building.floorPlans);
    //     setShowFloorPlan(true);
    //   } else {
    //     try {
    //       const response = await axios.get(`http://localhost:3001/api/floorplans/building/${building.id}`);
    //       if (building.tags.name == null) {  // unnamed buildings
    //         showNotification('No floor plans available for this building', 'info');
    //       }
    //       else if (response.data && response.data.length > 0) {   // buildings with uploaded plans
    //         setFloorPlans(response.data);
    //         setShowFloorPlan(true);
    //       } else {
    //         setFloorPlans(null)
    //         setShowFloorPlan(true);
    //       }
    //     } catch (error) {
    //       console.error('Error fetching floor plans:', error);
    //       showNotification('Error fetching floor plans', 'error');
    //     }
    //   }
    // };

    const mapCenter = [
      latitude !== undefined ? latitude : DEFAULT_LAT,
      longitude !== undefined ? longitude : DEFAULT_LON
    ];
    const mapZoom = zoom !== undefined ? zoom : DEFAULT_ZOOM;
  

    const renderSavedRoute = () => {
      if (selectedSavedRoute && Array.isArray(selectedSavedRoute.polyline) && selectedSavedRoute.polyline.length > 1) {
        console.log('Rendering saved route:', selectedSavedRoute);
        return (
          <Polyline 
            positions={selectedSavedRoute.polyline} 
            color="blue"
          >
            <Popup>
              {selectedSavedRoute.endLocation?.name || 'Unknown Destination'}
              <br />
              Distance: {selectedSavedRoute.distance?.toFixed(2) || 'N/A'} miles
              <br />
              Duration: {selectedSavedRoute.duration?.toFixed(0) || 'N/A'} minutes
            </Popup>
          </Polyline>
        );
      }
      // console.warn('Unable to render saved route:', selectedSavedRoute);
      return null;
    };
    
    return (
      <div className="map-wrapper">
    <MapContainer center={[latitude, longitude]} zoom={zoom} zoomControl={false} className="map-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapEventHandler selectedSavedRoute={selectedSavedRoute} />
      {renderSavedRoute()}
      {/* Add blue polyline nodes for the routing system */}
      {polylineCoordinates.length > 0 && (
        <Polyline key={selectedMode} positions={updatedPolylineCoordinates || polylineCoordinates} color={polylineColor} />
      )}
      {polylineCoordinates.map((coords, index) => (
        <Marker key={index} position={coords}>
          <Popup>
            Lat: {coords[0]}, Lon: {coords[1]}
          </Popup>
        </Marker>
      ))}
      <BuildingsRenderer 
        buildings={buildings} 
        viewIndoorPlan={handleViewIndoorPlan}
        getDirections={getDirections}
        user={user}
        showNotification={showNotification}
        favoriteLocations={favoriteLocations}
        isLoadingFavorites={isLoadingFavorites}
        onFavoriteToggle={onFavoriteToggle}
      />
      <BikeRacksRenderer bikeRacks={bikeRacks} isBikeRacksVisible={mapOptions.isBikeRacksVisible} />
      {parkingLots.map((lot, index) => (
          <Marker key={index} position={[lot.buildingPosition.lat, lot.buildingPosition.lon]}>
          </Marker>
        ))}
      {busStops.map((stop, index) => (
        <Marker
          key={index}
          position={[stop.lat, stop.lon]}
          icon={L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconAnchor: [10, 10]
          })}
        >
          <Popup>
            {stop.tags.name || 'Bus Stop'} <br />
            Operator: {stop.tags.operator || 'Operator'} <br />
            Bench: {stop.tags.bench || 'Bench Status Unknown'} <br />
          </Popup>
        </Marker>
      ))}
      <MapViewUpdater latitude={latitude} longitude={longitude} zoom={zoom} /> {/* Include the updater */}
      {userLocation && (
                <>
                    {/* Render Marker regardless of altitude */}
                    <Marker position={userLocation} icon = {customIcon}>
                        <Popup>
                            Lat: {userLocation[0]} <br />
                            Long: {userLocation[1]} <br />
                            {altitude && <>Alt: {altitude} m</>}
                            {accuracy && accuracy <= 100 ? <>Accuracy: {accuracy} m</> : <>Turn on your precise location</>}
                          </Popup>
                    </Marker>
                </>
            )}
            {/* {updatedPolylineCoordinates && (
              <Polyline positions={updatedPolylineCoordinates} color={polylineColor} />
            )} */}
    </MapContainer>
    <div className="amenities-menu">
        <MapOptions mapOptions={mapOptions} />
        <Parking updateMap={handleMapUpdate} markParkingLots={markParkingLots}/>
        <BusStops updateMap={handleMapUpdate} markBusStops={markBusStops}/>
      </div>
      {showFloorPlan && (
        <FloorPlanView 
          building={selectedBuilding}
          floorPlans={floorPlans}
          user={user}
          onClose={() => {
            setShowFloorPlan(false);
            setIndoorStart(null);
            setIndoorDestination(null);
          }}
          showNotification={showNotification}
          initialStart={indoorStart}
          initialDestination={indoorDestination}
          handleTitleClick={handleTitleClick}
        />
      )}
    </div>
  );
};
export default Map;
