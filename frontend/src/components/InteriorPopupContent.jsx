import React from 'react';
import './InteriorPopupContent.css';

const InteriorPopupContent = ({ roomName, onStartClick, onDestinationClick, onUpdateClick, onReserveClick, onClose, position }) => {
  const style = {
    position: 'absolute',
    top: position.y,
    left: position.x,
    transform: 'translate(-50%, -100%)', // Adjust as needed
    zIndex: 1000,
  };

  return (
    <div className="interior-popup" style={style}>
      <h3>{roomName}</h3>
      <div className="button-group">
        <button className="popup-button" onClick={onStartClick}>Start</button>
        <button className="popup-button" onClick={onDestinationClick}>Destination</button>
        <button className="popup-button" onClick={onUpdateClick} >Update</button>
        <button className="popup-button" onClick={onReserveClick} >Reserve</button>
        <button className="popup-close" onClick={onClose}>x</button>
      </div>
    </div>
  );
};

export default InteriorPopupContent;