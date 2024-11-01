import React from 'react';
import './InteriorPopupContent.css';

const InteriorPopupContent = ({ roomName, onStartClick, onDestinationClick, onClose }) => {
  return (
    <div className="interior-popup">
      <h3>{roomName}</h3>
      <div className="button-group">
        <button className="popup-button" onClick={onStartClick}>Start</button>
        <button className="popup-button" onClick={onDestinationClick}>Destination</button>
        <button className="popup-close" onClick={onClose}>x</button>
      </div>
    </div>
  );
};

export default InteriorPopupContent;