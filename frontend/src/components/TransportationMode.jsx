import React from 'react';
import './TransportationMode.css';

const TransportationMode = ({ selectedMode, onSelectMode }) => {
  return (
    <div className="transportation-mode">
      <h4>Select Mode of Transportation</h4>
      <button
        className={selectedMode === 'footpath' ? 'active' : ''}
        onClick={() => onSelectMode('footpath')}
      >
        Walk
      </button>
      <button
        className={selectedMode === 'bike' ? 'active' : ''}
        onClick={() => onSelectMode('bike')}
      >
        Bike
      </button>
      <button
        className={selectedMode === 'bus' ? 'active' : ''}
        onClick={() => onSelectMode('bus')}
      >
        Bus
      </button>
    </div>
  );
};

export default TransportationMode;