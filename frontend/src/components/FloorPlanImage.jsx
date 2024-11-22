import React, { useRef, useState, useEffect } from "react";

const FeaturePopup = ({ feature, isFeaturePopupOpen, setFeatures, features, linkSelectedFeatures, setIsFeaturePopupOpen, imageRenderProps }) => {
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
    top: feature.geometry.y * imageRenderProps.scale + imageRenderProps.y,
    left: feature.geometry.x * imageRenderProps.scale + imageRenderProps.x,
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

const RenderRooms = ({ rooms, onRoomClick, selectedFloorPlan, isEditModeOn, imageRenderProps, route }) => {
  if (isEditModeOn) return null;
  if (!rooms) return null;
  const selectedFloorIndex = selectedFloorPlan.floorIndex;
  let index = 0;
  
  const roomList = rooms.map((room) => {
    if (room.properties.Floor !== selectedFloorIndex) return null;
    const { x, y } = room.geometry;
    const transformedX = x * imageRenderProps.scale + imageRenderProps.x;
    const transformedY = y * imageRenderProps.scale + imageRenderProps.y;
    index++;
    return (
      <circle
        key={index}
        cx={transformedX}
        cy={transformedY}
        r="7"
        fill="lightgreen"
        stroke="black"
        strokeWidth="1"
        onClick={(event) => onRoomClick(event, room)}
        style={{ cursor: 'pointer' }}
      />
    )
  });
  if (!route) return roomList;
  const lineList = [];
  for (let i = 0; i < route.length - 1; i++) {
    if (route[i].floor !== selectedFloorIndex) continue; 
    if (route[i + 1].floor !== selectedFloorIndex) continue;
    const { x: x1, y: y1 } = route[i];
    const { x: x2, y: y2 } = route[i + 1];
    const transformedX1 = x1 * imageRenderProps.scale + imageRenderProps.x;
    const transformedY1 = y1 * imageRenderProps.scale + imageRenderProps.y;
    const transformedX2 = x2 * imageRenderProps.scale + imageRenderProps.x;
    const transformedY2 = y2 * imageRenderProps.scale + imageRenderProps.y;
    index++;
    lineList.push(
      <line
        key={index}
        x1={transformedX1}
        y1={transformedY1}
        x2={transformedX2}
        y2={transformedY2}
        stroke="red"
        strokeWidth="1"
      />
    );
  }
  return (
    <>
      {lineList}
      {roomList}
    </>
  );
};

const RenderIndoorNav = ({ features, onSVGClick, selectedFloorPlan, isEditModeOn, selectedFeature, imageRenderProps }) => {
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
    const transformedX = x * imageRenderProps.scale + imageRenderProps.x;
    const transformedY = y * imageRenderProps.scale + imageRenderProps.y;
    return (
      <circle
        key={index++}
        cx={transformedX}
        cy={transformedY}
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
      const transformedX = x * imageRenderProps.scale + imageRenderProps.x;
      const transformedY = y * imageRenderProps.scale + imageRenderProps.y;
      const transformedConnectedX = connectedX * imageRenderProps.scale + imageRenderProps.x;
      const transformedConnectedY = connectedY * imageRenderProps.scale + imageRenderProps.y;
      index++;
      lineList.push(
        <line
          key={index}
          x1={transformedX}
          y1={transformedY}
          x2={transformedConnectedX}
          y2={transformedConnectedY}
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
  route,
}) => {
  if (!selectedFloorPlan) return null;
  const [isFeaturePopupOpen, setIsFeaturePopupOpen] = useState(false);
  const [isRoomPopupOpen, setIsRoomPopupOpen] = useState(false);
  const svgRef = useRef(null);
  const imageRef = useRef(null);
  const [naturalImageSize, setNaturalImageSize] = useState({ width: 0, height: 0 });
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageRenderProps, setImageRenderProps] = useState({});

  const handleFloorPlanClick = (e) => {
    if (!naturalImageSize.width || !naturalImageSize.height) return;
    const nWidth = naturalImageSize.width;
    const nHeight = naturalImageSize.height;

    const bbox = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - bbox.left;
    const clickY = e.clientY - bbox.top;

    const x = (clickX / bbox.width) * nWidth;
    const y = (clickY / bbox.height) * nHeight;
    setIsFeaturePopupOpen(false);
    onFloorPlanClick(x, y);
  };

  const calculateImageRenderProps = () => {
    if (!naturalImageSize.width || !naturalImageSize.height) return;
    if (!svgSize.width || !svgSize.height) return;
    const { width: nWidth, height: nHeight } = naturalImageSize;
    const { width: svgWidth, height: svgHeight } = svgSize;
    const imageRatio = nWidth / nHeight;
    const svgRatio = svgWidth / svgHeight;
    let newWidth, newHeight, newX, newY, scale;
    if (imageRatio > svgRatio) {
      newWidth = svgWidth;
      newHeight = svgWidth / imageRatio;
      newX = 0;
      newY = (svgHeight - newHeight) / 2;
    } else {
      newHeight = svgHeight;
      newWidth = svgHeight * imageRatio;
      newY = 0;
      newX = (svgWidth - newWidth) / 2;
    }
    scale = newWidth / nWidth;
    setImageRenderProps({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      scale,
    });
    setImageLoaded(true);
  }

  const handleImageLoad = (e) => {
    setNaturalImageSize({
      width: e.target.width,
      height: e.target.height,
    });

  };

  const handleFeatureClick = (e, feature) => {
    if (selectedFeature?.properties?.id === feature.properties.id) {
      setIsFeaturePopupOpen(!isFeaturePopupOpen);
    } else {
      setIsFeaturePopupOpen(false);
    }
    onFeatureClick(e, feature);
  }

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    setSvgSize({
      width: rect.width,
      height: rect.height,
    });
  }, []);

  useEffect(() => {
    if (!svgSize.width || !svgSize.height) return;
    if (!naturalImageSize.width || !naturalImageSize.height) return;
    calculateImageRenderProps();
  }, [svgSize, naturalImageSize]);

  return (
    <>
    <FeaturePopup
      feature={selectedFeature} 
      isFeaturePopupOpen={isFeaturePopupOpen} 
      setFeatures={setFeatures}
      features={features}
      setIsFeaturePopupOpen={setIsFeaturePopupOpen}
      linkSelectedFeatures={linkSelectedFeatures}
      imageRenderProps={imageRenderProps}
    /> 
    <img
      src={imageUrl}
      alt=""
      style={{ display: "none" }}
      onLoad={handleImageLoad}
    />
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
    >
      {imageLoaded && 
        <image
          ref={imageRef}
          href={imageUrl}
          height={imageRenderProps.height}
          width={imageRenderProps.width}
          x={imageRenderProps.x}
          y={imageRenderProps.y}
          onClick={(e) => handleFloorPlanClick(e)}
        />
      }
      <RenderRooms 
        rooms={rooms} 
        onRoomClick={onRoomClick} 
        selectedFloorPlan={selectedFloorPlan}
        isEditModeOn={isEditModeOn}
        imageRenderProps={imageRenderProps}
        route={route}
      />
      <RenderIndoorNav
        features={features}
        onSVGClick={handleFeatureClick}
        selectedFloorPlan={selectedFloorPlan}
        isEditModeOn={isEditModeOn}
        selectedFeature={selectedFeature}
        imageRenderProps={imageRenderProps}
      />
    </svg>
    </>
  );
};

export default FloorPlanImage;

