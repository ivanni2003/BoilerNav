import axios from 'axios';
import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import arrowIcon from '../img/up-arrow.png';
import Amenities from './Amenities'
import SearchBar from './SearchBar'

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

const FloorPlan = ({ startNode, endNode, }) => {
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

    // Construct the 'd' attribute string
          const dString = data.route.reduce((acc, { x, y }, idx) => {
            return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
          }, '');

          console.log("SVG Path Data (d attribute):", dString);
          setPathD(dString);
        }
      } catch (error) {
        console.error("Failed to fetch path data:", error);
      }
    };

    fetchPath();
  }, [startNode, endNode]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 180 500" preserveAspectRatio="xMidYMid meet" >
      <path fill="none" d={pathD} strokeWidth="1" stroke="black" />
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

  useEffect(() => {
    async function fetchAndSetRooms() {
      const response = await axios.get(`${baseURL}/api/indoordata/${building.tags.name}`)
      const indoorData = response.data
      //console.log(response.data)
      //console.log(selectedFloorPlan)
    
      // Note: account for basement, 1, 2, 3, 4 for now. Need to change either floor plan or data to align and account for ground floors
      const filteredRooms = indoorData.features.filter(room => {
        const roomFloor = room.properties.Floor; 

        return (
          //room.properties.Type == "Room" && // only searching for rooms
          (selectedFloorPlan.floorNumber === 'Basement' && roomFloor === -1) || 
          (selectedFloorPlan.floorNumber === '1' && roomFloor === 0) || 
          (selectedFloorPlan.floorNumber === '2' && roomFloor === 1) || 
          (selectedFloorPlan.floorNumber === '3' && roomFloor === 2) || 
          (selectedFloorPlan.floorNumber === '4' && roomFloor === 3) 
        );
      });

      setRooms(filteredRooms.map(room => room.properties.RoomName));
    }
    fetchAndSetRooms()
    console.log(rooms)
  }, [selectedFloorPlan, building]);

  const markRooms = (room) => { // implement marking/highlighting room in some way
    alert(`You selected ${room}, Do smth here`)
  }

  return (
    <div className="floor-plan-fullscreen">
      <div className="floor-plan-search"> 
                <SearchBar items={rooms} updateMap={null} markRooms={markRooms} start={null} destination={null} searchStr={"Start"} />
                <SearchBar items={rooms} updateMap={null} markRooms={markRooms} start={null} destination={null} searchStr={"End"} />
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
        <img src={selectedFloorPlan.imageUrl} alt={`Floor ${selectedFloorPlan.floorNumber}`} />
        <FloorPlan startNode={145} endNode={12} />
      </div>
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
  selectedSavedRoute, handleMapUpdate }) => {
    const [showFloorPlan, setShowFloorPlan] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [floorPlans, setFloorPlans] = useState([]);
    const [parkingLots, setParkingLots] = useState([])

    const markParkingLots = (lots) => {
      setParkingLots(lots)
      console.log(parkingLots)

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
  
  var polylineColor = 'blue';
  if (selectedMode === "bike") {
    polylineColor = "green";
  }
  else if (selectedMode === "bus") {
    polylineColor = "red";
  }
  console.log("line color:", polylineColor);
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
      {parkingLots.map((lot, index) => (
          <Marker key={index} position={[lot.buildingPosition.lat, lot.buildingPosition.lon]}>
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
      <Amenities updateMap={handleMapUpdate} markParkingLots={markParkingLots}/>
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
