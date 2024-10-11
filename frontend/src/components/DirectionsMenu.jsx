import React from 'react'
import SearchBar from './SearchBar'
import './DirectionsMenu.css'

const baseURL = 'http://localhost:3001'

const DirectionsMenu = ({ items, updateMap, start, destination, closeDirections, handleRouting }) => {
    return (
    <div className="directions-menu">
        <div>
            <SearchBar items={items} updateMap={updateMap} start={start} destination={null} />
        </div>
        <div>
            <SearchBar items={items} updateMap={updateMap} start={null} destination={destination} />
        </div>
        <div className="button-container">
        <button onClick={closeDirections}>Close</button>
        <button onClick={() => handleRouting(start, destination)}>Go</button>
        </div>
    </div>
    );
  }

export default DirectionsMenu