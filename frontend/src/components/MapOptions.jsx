import React, { useState } from 'react';

const MapOptions = ({isVisible, onClose, mapOptions}) => {
  if (!isVisible) {
    return null;
  }
  const handleRerouteCheckbox = (newValue) => {
    mapOptions.setIsRerouteEnabled(newValue);
  }

  const handleBikeRacksCheckbox = (newValue) => {
    mapOptions.setIsBikeRacksVisible(newValue);
  }

  return (
    <div className="map-options-popup">
      <div className="popup-content">
        <span className="close" onClick={onClose}>&times;</span>
        <div className="popup-items">
          <label>
            <input type="checkbox" onChange={(e) => handleRerouteCheckbox(e.target.checked)} checked={mapOptions.isRerouteEnabled} />
            Enable Rerouting
          </label>
          <label>
            <input type="checkbox" onChange={(e) => handleBikeRacksCheckbox(e.target.checked)} checked={mapOptions.isBikeRacksVisible} />
            Show Bike racks
          </label>
        </div>
      </div>
    </div>
  );
}

const MapOptionsButton = ({mapOptions}) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  return (
    <div className="map-options-button">
      <button className='feature-button' onClick={() => setIsPopupVisible(true)}>Map Options</button>
      <MapOptions isVisible={isPopupVisible} onClose={() => setIsPopupVisible(false)} mapOptions={mapOptions} />
    </div>
  );
}

export default MapOptionsButton;
