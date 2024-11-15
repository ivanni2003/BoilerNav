import React, { useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const FloorPlanImage = ({ imageUrl, alt, onFloorPlanClick, rooms }) => {
  const [viewBox, setViewBox] = useState("0 0 1000 1000");
  const [imageTransform, setImageTransform] = useState(false);

  const handleImageTransform = (e) => {
    setImageTransform(true);
  }

  const handleStopImageTransform = (e) => {
    setImageTransform(false);
  }

  const handleClick = (e) => {
    if (imageTransform) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log("User clicked on the floor plan at: ", x, y);
    // onFloorPlanClick(x, y);
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (!naturalWidth || !naturalHeight) return;
    setViewBox(`0 0 ${naturalWidth} ${naturalHeight}`);
  };

  return (
    <TransformWrapper
      wheel={{ step: 0.1 }}
      pinch={{ step: 0.1 }}
      doubleClick={{ disabled: true }}
      minScale={0.5}
      onPanningStart={handleImageTransform}
      onPanningStop={handleStopImageTransform}
      onZoomStart={handleImageTransform}
      onZoomStop={handleStopImageTransform}
    >
      <TransformComponent>
          <svg
            width="100%"
            height="100%"
            viewBox={viewBox}
          >
            <image
              href={imageUrl}
              width="100%"
              height="100%"
              onClick={(e) => handleClick(e)}
              onLoad={(e) => handleImageLoad(e)}
            />
          </svg>
      </TransformComponent>
    </TransformWrapper>
  );
};

export default FloorPlanImage;

