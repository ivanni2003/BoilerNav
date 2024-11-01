import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import arrowIcon from '../img/up-arrow.png';
import Amenities from './Amenities'
import SearchBar from './SearchBar'
import BusStops from './BusStops'
import MapOptions from './MapOptions'
import DirectionsMenu from './DirectionsMenu'
import InteriorPopupContent from './InteriorPopupContent';

import { MapContainer, TileLayer, CircleMarker, Marker, useMap, Polyline, Circle, Popup, useMapEvents } from 'react-leaflet';


const baseURL = "http://localhost:3001";
const buildingAPI = `${baseURL}/api/ways/buildings`;
const nodeAPI = `${baseURL}/api/nodes`;
const nodeIDAPI = `${baseURL}/api/nodes/id`;

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

  const FloorPlan = ({ startNode, endNode, rooms, setDistancetime, floorNumber, markedRooms, handleRoomClick}) => {
    const [pathD, setPathD] = useState('');

    useEffect(() => {
      const fetchPath = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/indoornav/path?start=${startNode}&end=${endNode}`);
          const data = await response.json();
          //console.log(response);
          console.log(data);
          

          if (data.route) {
            console.log("Path data received:", data.route);
            //average meters/second walk speed
            const avgMsRate = 1.3;
            const distance = (data.distance).toFixed(2);
            //meters per second
            const time = ((distance / avgMsRate) / 60).toFixed(2);
            setDistancetime(distance, time)
            // Construct the 'd' attribute string

            const floorMappings = { 'Basement': -1, '1': 0, '2': 1, '3': 2 };
            const roomFloor = floorMappings[floorNumber] ?? 0;
            let lastFloor = null;
            const dString = data.route.reduce((acc, { x, y, floor }) => {
              // If this point is on a new floor, start a new path with 'M'
              if (roomFloor === floor) {
                const command = lastFloor === floor ? `L ${x} ${y}` : `M ${x} ${y}`;
                lastFloor = floor; // Update last floor seen
                return `${acc} ${command}`;
              }
              return acc;
            }, '');
            console.log("dString: ", dString);
            console.log("roomFloor: ", roomFloor)
            console.log("floorNumber:", floorNumber)

          console.log("SVG Path Data (d attribute):", dString);
          setPathD(dString);
        }
      } catch (error) {
        console.error("Failed to fetch path data:", error);
      }
    };

      fetchPath();
    }, [startNode, endNode, floorNumber]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 180 500" preserveAspectRatio="xMidYMid meet" >
      <path fill="none" d={pathD} strokeWidth="1" stroke="black" />

      {rooms.map((data) => (
        <circle
          cx={data.x}
          cy={data.y}
          r="5"
          fill="yellow"
          stroke="black"
          strokeWidth="1"
          onClick={() => handleRoomClick(data)
          //   alert(
          //   data.room.properties.RoomName + "\n" + 
          //   data.room.properties.Type + "\n" 
          // )
        }
          style={{ cursor: 'pointer' }}
        />
        ))}
    </svg>
  );
};


const MapViewUpdater = ({ latitude, longitude, zoom }) => {
  const map = useMap(); 

  let SouthWestCoords = [40.40815, -86.95308];
  let NorthEastCoords = [40.44628, -86.89712];
  let WL_Bounds = [SouthWestCoords, NorthEastCoords]; 
  map.setMaxBounds(WL_Bounds);
  map.setMinZoom(15);

  useEffect(() => {
    map.setView([latitude, longitude], zoom); 
  }, [latitude, longitude, zoom, map]); 
};





const FloorPlanView = ({ building, floorPlans, onClose}) => {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(floorPlans[0]);
  const [rooms, setRooms] = useState([])
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);
  const [markedRooms, setMarkedRooms] = useState([]);
  const imageRef = useRef(null); // Ref to access image dimensions
  const [showDirectionsMenu, setShowDirectionsMenu] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Store selected room data for DirectionsMenu
  const [showPopup, setShowPopup] = useState(false);
  const [start, setStart] = useState("StairUp"); // State for start location
  const [destination, setDestination] = useState(null); // State for destination location

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setShowPopup(true); // Show the popup
    setShowDirectionsMenu(true) //  show the directions Menu 
  }

  const handleStartClick = () => {
    setStart(selectedRoom.room); // Set the selected room as the destination
    console.log("Set start location for:", start);
    console.log("Set destination location for:", destination);
    setShowPopup(false);
  };

  const handleDestinationClick = () => {
    setDestination(selectedRoom.room); // Set the selected room as the destination
    console.log("Set start location for:", start);
    console.log("Set destination location for:", destination);
    setShowPopup(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleCloseDirectionsMenu = () => {
    setShowDirectionsMenu(false);
    setSelectedRoom(null);
  };

  useEffect(() => {
    async function fetchAndSetRooms() {
      const response = await axios.get(`${baseURL}/api/indoordata/${building.tags.name}`)
      const indoorData = response.data
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
  }, [selectedFloorPlan, building]);

  const markRooms = (room) => { // implement marking/highlighting room in some way
    console.log(room)
    const location = latLonToXY(room.geometry.coordinates[1], room.geometry.coordinates[0])
    console.log(location)
    const newMarkedRooms = [...markedRooms, location];
    setMarkedRooms(newMarkedRooms); // Update state with the new array
    console.log(newMarkedRooms); // Log the new array

  }
  const setDistancetime = (newDistance, newTime) => {
    setDistance(newDistance);
    setTime(newTime);
  }

  return (
    <div className="floor-plan-fullscreen">
      <div className="floor-plan-search"> 
                <SearchBar items={rooms} updateMap={null} markRooms={markRooms} viewSavedRoute={null} start={null} destination={null} searchStr={"Start"} />
                <SearchBar items={rooms} updateMap={null} markRooms={markRooms} viewSavedRoute={null} start={null} destination={null} searchStr={"End"} />
                <div>
                  <p>{distance !== null ? `Distance: ${distance} meters` : 'Distance not calculated'}</p>
                  <p>{time !== null ? `Time: ${time} minutes` : 'Time not calculated'}</p>
                </div>
      </div>
      <div className="floor-plan-header">
        <select 
          value={selectedFloorPlan.floorNumber} 
          onChange={(e) => setSelectedFloorPlan(floorPlans.find(fp => fp.floorNumber === e.target.value))}
        >
          {floorPlans.map(fp => (
            <option key={fp.floorNumber} value={fp.floorNumber}>
              Floor {fp.floorNumber}
            </option>

          ))}
        </select>
        <button onClick={onClose}>×</button>
      </div>
      <div className="floor-plan-content">
        <img ref={imageRef} src={selectedFloorPlan.imageUrl} alt={`Floor ${selectedFloorPlan.floorNumber}`} />
        
        {/* Path handler for interior */}
        <FloorPlan startNode={start?.properties?.id || 11} endNode={destination?.properties?.id || 20} rooms={rooms} setDistancetime={setDistancetime} floorNumber={selectedFloorPlan.floorNumber} markedRooms={markedRooms} handleRoomClick={handleRoomClick} 
        />
        {showPopup && selectedRoom && (
        <InteriorPopupContent
          roomName={selectedRoom.room.properties.RoomName}
          onStartClick={handleStartClick}
          onDestinationClick={handleDestinationClick}
          onClose={handleClosePopup}
        />
      )}

      </div>

      {showDirectionsMenu && selectedRoom && (
        <DirectionsMenu
          start={start} // Assuming current location for start
          destination={destination} // Pass selected room data as destination
          closeDirections={handleCloseDirectionsMenu}
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
        />
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
    console.log('Building ID:', building.id);
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
    return <FloorPlanView building={building} floorPlans={floorPlans} onClose={() => setShowFloorPlan(false)} />;
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
  mapOptions }) => {
    const [showFloorPlan, setShowFloorPlan] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [floorPlans, setFloorPlans] = useState([]);
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


    const handleViewIndoorPlan = async (building) => {
      setSelectedBuilding(building);
      if (building.floorPlans && building.floorPlans.length > 0) {
        setFloorPlans(building.floorPlans);
        setShowFloorPlan(true);
      } else {
        try {
          const response = await axios.get(`http://localhost:3001/api/floorplans/building/${building.id}`);
          if (response.data && response.data.length > 0) {
            setFloorPlans(response.data);
            setShowFloorPlan(true);
          } else {
            showNotification('No floor plans available for this building', 'info');
          }
        } catch (error) {
          console.error('Error fetching floor plans:', error);
          showNotification('Error fetching floor plans', 'error');
        }
      }
    };

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
      console.warn('Unable to render saved route:', selectedSavedRoute);
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
    <span className="amenities-menu">
      <MapOptions mapOptions={mapOptions} />
      <Amenities updateMap={handleMapUpdate} markParkingLots={markParkingLots}/>
      <BusStops updateMap={handleMapUpdate} markBusStops={markBusStops}/>
    </span>
    {showFloorPlan && (
        <FloorPlanView 
          building={selectedBuilding}
          floorPlans={floorPlans}
          onClose={() => setShowFloorPlan(false)}
        />
      )}
    </div>
  );
};
export default Map;
