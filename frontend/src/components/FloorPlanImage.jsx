import React, { useRef, useState } from "react";

const FeaturePopup = ({ feature, isFeaturePopupOpen, setFeatures, features, linkSelectedFeatures, setIsFeaturePopupOpen }) => {
  const [editName, setEditName] = useState(false);
  if (!isFeaturePopupOpen) return null;
  const roomName = feature.properties.RoomName;

  const featureTypes = [
    'Entrance', 'StairUp', 'StairDown', 'Restroom', 'Elevator', 'Room', 'Intersection', 
    'MaxNorth', 'MaxSouth', 'MaxEast', 'MaxWest'
  ];

  const handleChangeFeatureType = (newType) => {
    const updatedFeatures = features.map((f) => {
      if (f.properties.id === feature.properties.id) {
        f.properties.Type = newType;
      }
      return f;
    });
    setFeatures(updatedFeatures);
  };

  const handleClickName = () => {
    setEditName(true);
  }

  const handleChangeRoomName = (newName) => {
    const updatedFeatures = features.map((f) => {
      if (f.properties.id === feature.properties.id) {
        f.properties.RoomName = newName;
      }
      return f;
    });
    setFeatures(updatedFeatures);
  }

  const handleDeleteFeature = () => {
    const linkedFeaturesIDs = feature.properties.LinkedTo;
    const filteredFeatures = features.filter((f) => f.properties.id !== feature.properties.id);
    const updatedFeatures = filteredFeatures.map((f) => {
      const newLinkedTo = f.properties.LinkedTo.filter((id) => id !== feature.properties.id);
      f.properties.LinkedTo = newLinkedTo;
      return f;
    });
    setIsFeaturePopupOpen(false);
    setFeatures(updatedFeatures);
  };

  const handleLinkFeature = () => {
    linkSelectedFeatures();
  };
    

  const style = {
    position: 'absolute',
    top: feature.geometry.y,
    left: feature.geometry.x,
    transform: 'translate(-50%, -100%)', // Adjust as needed
    zIndex: 1000,
  };

  return (
    <div className="interior-popup" style={style}>
      { !editName ? ( 
      <h3 onClick={handleClickName}>{roomName}</h3>
      ) : (
      <input type="text" 
            value={roomName}
            onChange={(e) => handleChangeRoomName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' ? setEditName(false) : null}
      />
      )}
      <div className="button-group">
        {/* Dropdown for feature type */}
        <div className="dropdown">
          <select
            value={feature.properties.Type}
            onChange={(e) => handleChangeFeatureType(e.target.value)}
          >
          { featureTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
          </select>
        </div>
        <button onClick={handleDeleteFeature}>Delete</button>
        <button onClick={handleLinkFeature}>Link With Last Selected</button>
        <button className="popup-close" onClick={() => setIsFeaturePopupOpen(false)}>x</button>
      </div>
    </div>
  );
};

const RenderRooms = ({ rooms, onRoomClick, selectedFloorPlan, isEditModeOn }) => {
  if (isEditModeOn) return null;
  if (!rooms) return null;
  const selectedFloorIndex = selectedFloorPlan.floorIndex;
  
  return rooms.map((room) => {
    if (room.properties.Floor !== selectedFloorIndex) return null;
    const { x, y } = room.geometry;
    const index = room.properties.id;
    return (
      <circle
        key={index}
        cx={x}
        cy={y}
        r="7"
        fill="lightgreen"
        stroke="black"
        strokeWidth="1"
        onClick={(event) => onRoomClick(event, room)}
        style={{ cursor: 'pointer' }}
      />
    )
  });
};

const RenderIndoorNav = ({ features, onSVGClick, selectedFloorPlan, isEditModeOn, selectedFeature }) => {
  if (!isEditModeOn) return null;
  if (!features) return null;
  const selectedFloorIndex = selectedFloorPlan.floorIndex;
  // Have to return the feature and any lines to any connected features
  let index = 0;
  const featureList = features.map((feature) => {
    if (feature.properties.Floor !== selectedFloorIndex) return null;
    const { x, y } = feature.geometry;
    const featureOptions = {};
    if (feature.properties.Type === 'Room') {
      featureOptions.fill = 'lightgreen';
    } else if (feature.properties.Type === 'Intersection') {
      featureOptions.fill = 'lightgray';
    } else {
      featureOptions.fill = 'red';
    }
    if (feature.properties.id === selectedFeature?.properties?.id) {
      featureOptions.stroke = 'gold';
    } else {
      featureOptions.stroke = 'black';
    }
    return (
      <circle
        key={index++}
        cx={x}
        cy={y}
        r="7"
        fill={featureOptions.fill}
        stroke={featureOptions.stroke}
        strokeWidth="1"
        onClick={(event) => onSVGClick(event, feature)}
        style={{ cursor: 'pointer' }}
      />
    )
  });
  const lineList = [];
  features.forEach((feature) => {
    // Skip if the feature is not on the selected floor
    if (feature.properties.Floor !== selectedFloorIndex) return null;
    const { x, y } = feature.geometry;
    const connectedFeatures = feature.properties.LinkedTo;
    connectedFeatures.forEach((connectedFeatureId) => {
      if (connectedFeatureId < feature.properties.id) return null;
      const connectedFeature = features.find((feature) => feature.properties.id === connectedFeatureId);
      if (!connectedFeature) return null;
      if (connectedFeature.properties.Floor !== selectedFloorIndex) return null;
      const { x: connectedX, y: connectedY } = connectedFeature.geometry;
      index++;
      lineList.push(
        <line
          key={index}
          x1={x}
          y1={y}
          x2={connectedX}
          y2={connectedY}
          stroke="black"
          strokeWidth="1"
        />
      )
    });
  });
  return (
    <>
      {lineList}
      {featureList}
    </>
  );
};

const FloorPlanImage = ({
  imageUrl, 
  alt, 
  onFloorPlanClick,
  onRoomClick,
  onFeatureClick,
  rooms,
  features,
  isEditModeOn,
  setSelectedRoom,
  selectedFloorPlan,
  selectedFeature,
  setFeatures,
  linkSelectedFeatures,
}) => {
  const [viewBox, setViewBox] = useState("0 0 1000 1000");
  const [isFeaturePopupOpen, setIsFeaturePopupOpen] = useState(false);
  const [isRoomPopupOpen, setIsRoomPopupOpen] = useState(false);

  const handleFloorPlanClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsFeaturePopupOpen(false);
    onFloorPlanClick(x, y);
  };

  const handleImageLoad = (e) => {
    // return; // I think this handler ended up being unnecessary
    const { naturalWidth, naturalHeight } = e.target;
    if (!naturalWidth || !naturalHeight) return;
    setViewBox(`0 0 ${naturalWidth} ${naturalHeight}`);
  };

  const handleFeatureClick = (e, feature) => {
    if (selectedFeature?.properties?.id === feature.properties.id) {
      setIsFeaturePopupOpen(!isFeaturePopupOpen);
    } else {
      setIsFeaturePopupOpen(false);
    }
    onFeatureClick(e, feature);
  }

  return (
    <> 
    <FeaturePopup
    feature={selectedFeature} 
    isFeaturePopupOpen={isFeaturePopupOpen} 
    setFeatures={setFeatures}
    features={features}
    setIsFeaturePopupOpen={setIsFeaturePopupOpen}
    linkSelectedFeatures={linkSelectedFeatures}
    /> 
    <svg
      width="100%"
      height="100%"
    >
      <image
        href={imageUrl}
        width="100%"
        height="100%"
        onClick={(e) => handleFloorPlanClick(e)}
        onLoad={(e) => handleImageLoad(e)}
      />
      <RenderRooms rooms={rooms} onRoomClick={onRoomClick} selectedFloorPlan={selectedFloorPlan} isEditModeOn={isEditModeOn} />
      <RenderIndoorNav features={features} onSVGClick={handleFeatureClick} selectedFloorPlan={selectedFloorPlan} isEditModeOn={isEditModeOn} selectedFeature={selectedFeature} />
    </svg>
    </>
  );
};

export default FloorPlanImage;

