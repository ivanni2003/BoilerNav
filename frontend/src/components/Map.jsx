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
import FloorPlanImage from './FloorPlanImage';
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

const MapViewUpdater = ({ latitude, longitude, zoom }) => {
  const map = useMap(); 
  const heatmapLayerRef = useRef(null);

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
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }

      // Convert data to Leaflet.heat format
      const heatData = heatmapData.map(({ lat, long, intensity }) => [lat, long, intensity]);

      // Add the new heatmap layer
      heatmapLayerRef.current = L.heatLayer(heatData, {
        radius: 20,
        blur: 10,
        maxZoom: 17,
      }).addTo(map);
    }

    updateHeatmap();

    // Cleanup function to remove the heatmap layer when the component unmounts
    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
    };
  }, [latitude, longitude, zoom, map, heatData]); 

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
  // TODO: If floorPlans is updated to include both floorIndex and floorNumber, this can be updated
  const startingFloorPlan = floorPlans && floorPlans.length > 0 ? floorPlans[0] : null;
  if (startingFloorPlan) {
    startingFloorPlan.floorIndex = 0;
  }
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(startingFloorPlan);
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);
  const [markedRoom, setMarkedRoom] = useState(null);
  const imageRef = useRef(null); // Ref to access image dimensions
  const [showDirectionsMenu, setShowDirectionsMenu] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Store selected room data for DirectionsMenu
  const [showPopup, setShowPopup] = useState(false);
  const [route, setRoute] = useState(null);
  const [isEditModeOn, setIsEditModeOn] = useState(false);

  const [topRooms, setTopRooms] = useState([])

  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState(initialStart); // Initialize with prop
  const [destination, setDestination] = useState(initialDestination); // Initialize with prop

  const [indoorNavData, setIndoorNavData] = useState(null);
  const [rooms, setRooms] = useState([])
  const [features, setFeatures] = useState([])
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [lastSelectedFeature, setLastSelectedFeature] = useState(null);

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

    const { x, y } = room.geometry;

    setPopupPosition({ x, y });
  }

  const handleFloorPlanClick = (x, y) => {
    if (!isEditModeOn) return;
    console.log("User clicked on the floor plan at: ", x, y);
    // Find the greatest id in the features array
    const maxId = features.reduce((max, feature) => feature.properties.id > max ? feature.properties.id : max, 0);
    const newFeature = {
      properties: {
        id: maxId + 1,
        Type: "Intersection",
        RoomName: "Intersection",
        LinkedTo: [],
        Floor: selectedFloorPlan.floorIndex,
        DestinationCount: 0
      },
      geometry: { x, y }
    }
    if (selectedFeature) {
      linkTwoFeatures(selectedFeature, newFeature);
    }
    setFeatures([...features, newFeature]);
    setLastSelectedFeature(selectedFeature);
    setSelectedFeature(newFeature);
    console.log("Added new feature:", newFeature);
  }

  const handleFeatureClick = (event, feature) => {
    if (!isEditModeOn) return;
    console.log("User clicked on feature:", feature);
    if (!selectedFeature) {
      setLastSelectedFeature(null);
      setSelectedFeature(feature);
    } else if (selectedFeature.properties.id === feature.properties.id) {

    } else {
      setLastSelectedFeature(selectedFeature);
      setSelectedFeature(feature);
    }
  }

  useEffect(() => {
    if (initialStart && initialDestination) {
      setStart(initialStart);
      setDestination(initialDestination);
      setShowDirectionsMenu(true);
    }
  }, [initialStart, initialDestination]);

  const handleStartClick = () => {
    setStart(selectedRoom); // Set the selected room as the destination
    //console.log("Set start location for:", start);
    //console.log("Set destination location for:", destination);
    setShowPopup(false);
  };

  const handleDestinationClick = () => {
    setDestination(selectedRoom); // Set the selected room as the destination
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

  const handleChangeSelectedFloorPlan = (e) => {
    const index = floorPlans.findIndex(fp => fp.floorNumber === e.target.value);
    const newSelectedFloorPlan = floorPlans[index];
    newSelectedFloorPlan.floorIndex = index;
    setSelectedFloorPlan(newSelectedFloorPlan);
  }

  const calculateScale = async () => {
    // Find the scale of the floor plan by comparing the locations of
    // MaxNorth, MaxEast, MaxSouth, MaxWest nodes with
    // the locations of building nodes from map data
    const maxNorth = features.find((feature) => feature.properties.Type === 'MaxNorth');
    const maxSouth = features.find((feature) => feature.properties.Type === 'MaxSouth');
    const maxEast = features.find((feature) => feature.properties.Type === 'MaxEast');
    const maxWest = features.find((feature) => feature.properties.Type === 'MaxWest');
    if (!maxNorth || !maxSouth || !maxEast || !maxWest) {
      console.error('Failed to find MaxNorth, MaxSouth, MaxEast, or MaxWest features');
      return -1;
    }
    const nSDistance = Math.abs(maxNorth.geometry.y - maxSouth.geometry.y);
    const eWDistance = Math.abs(maxEast.geometry.x - maxWest.geometry.x);
    try {
      const buildingWayResponse = await axios.get(`${baseURL}/api/ways/id/${building.id}`);
      const buildingWay = buildingWayResponse.data[0];
      const buildingNodeIDs = buildingWay.nodes.join(',');
      const buildingNodesResponse = await axios.get(`${baseURL}/api/nodes/id/${buildingNodeIDs}`);
      const buildingNodes = buildingNodesResponse.data;
      const buildingNodesLat = buildingNodes.map((node) => node.lat);
      const buildingNodesLon = buildingNodes.map((node) => node.lon);
      const maxLat = Math.max(...buildingNodesLat);
      const minLat = Math.min(...buildingNodesLat);
      const maxLon = Math.max(...buildingNodesLon);
      const minLon = Math.min(...buildingNodesLon);
      const buildingNSDistanceMeters = Math.abs(maxLat - minLat) * 111111;
      const buildingEWDistanceMeters = Math.abs((maxLon - minLon) * 111111 * Math.cos((maxLat + minLat) / 2));
      const scaleNS = buildingNSDistanceMeters / nSDistance;
      const scaleEW = buildingEWDistanceMeters / eWDistance;
      const scale = (scaleNS + scaleEW) / 2;
      return scale;
    } catch (error) {
      console.error('Failed to calculate scale:', error);
      return -1;
    }
  }

  const handleEditModeButton = async () => {
    if (isEditModeOn) {
      // TODO: Send update request to server instead of instant update
      const scale = await calculateScale();
      console.log("Scale:", scale);
      const indoorData = { ...indoorNavData, features: features, scale: scale };
      const response = axios.post(`${baseURL}/api/indoordata`, indoorData);
      if (response.status === 400) {
        console.error('Failed to update indoor data:', response.data);
        showNotification('Failed to update indoor data.', 'error');
      }
    }
    setIsEditModeOn(!isEditModeOn);
  };

  const linkTwoFeatures = (feature1, feature2) => {
    if (!feature1 || !feature2) return;
    if (feature1.properties.id === feature2.properties.id) return;
    const newFeature1 = { ...feature1 };
    const newFeature2 = { ...feature2 };
    if (!feature1.properties.LinkedTo.includes(feature2.properties.id)) {
      newFeature1.properties.LinkedTo.push(feature2.properties.id);
    }
    if (!feature2.properties.LinkedTo.includes(feature1.properties.id)) {
      newFeature2.properties.LinkedTo.push(feature1.properties.id);
    }
    const newFeatures = features.map((feature) => {
      if (feature.properties.id === feature1.properties.id) {
        return newFeature1;
      }
      if (feature.properties.id === feature2.properties.id) {
        return newFeature2;
      }
      return feature;
    });
    setFeatures(newFeatures);
  };

  const handleLinkSelectedFeatures = () => {
    linkTwoFeatures(selectedFeature, lastSelectedFeature);
  };

  const handleClose = (e) => {
    e.preventDefault();
    clearRoute();
    onClose();
  };

  const handleRouting = async () => {
    console.log("Routing from:", start, "to:", destination);
    if (!start || !destination) return;
    const buildingNameNoSpaces = building.tags.name.replaceAll(' ', '');
    try {
      const response = await axios.get(`${baseURL}/api/indoornav/path?building=${buildingNameNoSpaces}&start=${start.properties.id}&end=${destination.properties.id}`);
      const data = response.data;
      if (data.route) {
        const avgMsRate = 1.3;
        const distance = (data.distance).toFixed(2);
        const time = ((distance / avgMsRate) / 60).toFixed(2);
        setDistancetime(distance, time);
        try {
          await axios.patch(`http://localhost:3001/api/indoordata/${buildingNameNoSpaces}/${destination.properties.id}`)
        } catch (error) {
          console.log(error);
        }
        setRoute(data.route);
      }
    } catch (error) {
      console.error("Failed to fetch path data:", error);
      showNotification('Failed to fetch path data.', 'error');
    }
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
    async function fetchIndoorNavData() {
      const buildingNameNoSpaces = building.tags.name.replaceAll(' ', '');
      setLastSelectedFeature(null);
      setSelectedFeature(null);
      try {
        // Remove all spaces from building name
        // URL doesn't accept spaces?
        const response = await axios.get(`${baseURL}/api/indoordata/${buildingNameNoSpaces}`);
        if (response.status !== 200) {
          console.error("Failed to fetch indoor data:", response.data);
          showNotification('Failed to fetch indoor data.', 'error');
          return;
        }
        console.log("Fetched indoor data:", response.data);
        const indoorData = response.data;
        setIndoorNavData(indoorData);
      // Catch 404 error and create new indoor data
      } catch (error) {
        if (error.response.status === 404) {
          console.error("Indoor data not found for building:", building.tags.name);
          showNotification('Indoor data not found for this building.', 'error');
          const indoorData = {
            name: buildingNameNoSpaces,
            floors: [],
            features: [],
            scale: -1,
          };
          // TODO: If floorNumber becomes becomes the actual floor number, and a floorName is added to floorPlans, this
          // needs to be updated to match the new structure
          floorPlans.forEach((floorPlan, index) => {
            indoorData.floors.push({
              floorName: floorPlan.floorNumber,
              floorIndex: index,
            });
          });
          setIndoorNavData(indoorData);
          console.log("Created new indoor data:", indoorData);
          return;
        } else {
          console.error("Failed to fetch indoor data:", error);
          showNotification('Failed to fetch indoor data.', 'error');
        }
      }
    }
    fetchIndoorNavData();
  }, [building]);

  useEffect(() => {
    function setFilteredRooms() {
      const indoorData = indoorNavData;
      if (!indoorData || !selectedFloorPlan) return;
      // Find the index of element in indoorData.floor that matches selectedFloorPlan.floorNumber
      const floorFromFeatureCollection = indoorData.floors.find((floor) => floor.floorName === selectedFloorPlan.floorNumber);
      if (!floorFromFeatureCollection) {
        console.error('Floor not found in indoor data:', selectedFloorPlan.floorNumber, 
          "\nAvailable floors:", indoorData.floors);
        return;
      }
      const features = indoorData.features;
      const floorIndex = floorFromFeatureCollection.floorIndex;
      const filteredRooms = features.filter((feature) => {
        if (feature.properties.Type !== 'Room') return false;
        if (feature.properties.Floor !== floorIndex) return false;
        return true;
      })
      setRooms(filteredRooms);
    }
    setFilteredRooms();
  }, [indoorNavData, selectedFloorPlan]);

  useEffect(() => {
    if (!indoorNavData) return;
    setFeatures(indoorNavData.features);
  }, [indoorNavData]);


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


      <div className="floor-plan-editing">
        <button className="edit-mode-btn" onClick={() => handleEditModeButton()}>Toggle Edit Mode</button>
        <SubmitFloorPlan user={user} building={building} showNotification={showNotification}/>
      </div>
      <div className="floor-plan-header">
        <select 
          value={selectedFloorPlan?.floorNumber ?? 0}
          onChange={handleChangeSelectedFloorPlan}
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
        <FloorPlanImage
          imageUrl={selectedFloorPlan?.imageUrl ?? null}
          alt={selectedFloorPlan?.floorNumber ? `Floor ${selectedFloorPlan.floorNumber}` : 'No floor plan available'}
          onFloorPlanClick={handleFloorPlanClick}
          onRoomClick={handleRoomClick}
          onFeatureClick={handleFeatureClick}
          rooms={rooms}
          features={features}
          isEditModeOn={isEditModeOn}
          selectedFloorPlan={selectedFloorPlan}
          selectedFeature={selectedFeature}
          setFeatures={setFeatures}
          linkSelectedFeatures={handleLinkSelectedFeatures}
        />
        
        {/* Path handler for interior */}
         {/* need to pass the building over */}
        {/*<FloorPlan 
          startNode={start?.properties?.id} 
          endNode={destination?.properties?.id} 
          rooms={rooms} 
          setDistancetime={setDistancetime} 
          floorNumber={selectedFloorPlan?.floorNumber ?? 0} 
          markedRoom={markedRoom} 
          handleRoomClick={handleRoomClick} 
          building={building}
        />*/}
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
            roomName={selectedRoom.properties.RoomName}
            onStartClick={handleStartClick}
            onDestinationClick={handleDestinationClick}
            onClose={handleClosePopup}
            position={popupPosition}
          />
        )}
      </div>

      {showDirectionsMenu && selectedRoom && (
        <div className="floor-plan-directions-menu"> 
        <DirectionsMenu
          start={start} // Assuming current location for start
          destination={destination} // Pass selected room data as destination
          closeDirections={handleRouteClose}
          handleRouting={handleRouting}
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

const PopupContent = ({ building, viewIndoorPlan, getDirections, user, showNotification, favoriteLocations, isLoadingFavorites, onFavoriteToggle, handleScheduleBuildingSelect }) => {
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
        <button
          className="popup-button"
          onClick={() => handleScheduleBuildingSelect(building)}>
          Add to Schedule
        </button>
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

const BuildingsRenderer = ({ buildings, viewIndoorPlan, getDirections, user, showNotification, favoriteLocations, isLoadingFavorites, onFavoriteToggle, handleScheduleBuildingSelect }) => {
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
        onFavoriteToggle={onFavoriteToggle}
        handleScheduleBuildingSelect={handleScheduleBuildingSelect}
        />
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
  handleTitleClick,
  handleScheduleClick,
  handleScheduleBuildingSelect,
}) => {
  const [parkingLots, setParkingLots] = useState([])
  const [busStops, setBusStops] = useState([]);
  const [bikeRacks, setBikeRacks] = useState([]);

  const markParkingLots = (lots) => {
    setParkingLots(lots)
    console.log(parkingLots)

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

  const customIconHTML = `<div style="transform: rotate(${heading || 0}deg); width: 32px; height: 32px;">` + `<img src="${arrowIcon}" style="width: 100%; height: 100%;" alt="Marker" />` + `</div>`;

  const customIcon = L.divIcon({
    className: "custom-marker",
    html: customIconHTML,
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
          handleScheduleBuildingSelect={handleScheduleBuildingSelect}
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
        <button onClick={(e) => handleScheduleClick()}>Schedule</button>
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
