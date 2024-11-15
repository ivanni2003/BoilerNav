import React, { useRef, useState } from "react";

const RenderRooms = ({ rooms, onRoomClick, selectedFloorPlan, isEditModeOn }) => {
  if (isEditModeOn) return null;
  if (!rooms) return null;
  const selectedFloorIndex = selectedFloorPlan.floorIndex;
  
  return rooms.map((room) => {
    if (room.properties.floor !== selectedFloorIndex) return null;
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
  const featureList = features.map((feature) => {
    if (feature.properties.floor !== selectedFloorIndex) return null;
    const { x, y } = feature.geometry;
    const index = feature.properties.id;
    const featureOptions = {};
    if (feature.properties.type === 'room') {
      featureOptions.fill = 'lightgreen';
    } else if (feature.properties.type === 'Intersection') {
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
        key={index}
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
    if (feature.properties.floor !== selectedFloorIndex) return null;
    const { x, y } = feature.geometry;
    const index = feature.properties.id;
    const connectedFeatures = feature.properties.linkedTo;
    connectedFeatures.forEach((connectedFeatureId) => {
      if (connectedFeatureId < feature.properties.id) return null;
      const connectedFeature = features.find((feature) => feature.properties.id === connectedFeatureId);
      if (connectedFeature.properties.floor !== selectedFloorIndex) return null;
      const { x: connectedX, y: connectedY } = connectedFeature.geometry;
      lineList.push(
        <line
          key={index + connectedFeatureId}
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
  console.log("featureList length: ", featureList.length);
  console.log("lineList length: ", lineList.length);
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
  selectedFeature
}) => {
  const [viewBox, setViewBox] = useState("0 0 1000 1000");

  const handleFloorPlanClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onFloorPlanClick(x, y);
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (!naturalWidth || !naturalHeight) return;
    setViewBox(`0 0 ${naturalWidth} ${naturalHeight}`);
  };

  return (
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
      <RenderIndoorNav features={features} onSVGClick={onFeatureClick} selectedFloorPlan={selectedFloorPlan} isEditModeOn={isEditModeOn} selectedFeature={selectedFeature} />
    </svg>
  );
};

export default FloorPlanImage;

