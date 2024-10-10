import React from 'react'
import SearchBar from './SearchBar'
import './DirectionsMenu.css'

const baseURL = 'http://localhost:3001'

const DirectionsMenu = ({ items, updateMap, start, destination, closeDirections, handleRouting }) => {
    return (
    <div className="directions-menu">
        <div className="search-bar-container">
            <SearchBar items={items} updateMap={updateMap} start={start} destination={null} />
        </div>
        <div className="search-bar-container">
            <SearchBar items={items} updateMap={updateMap} start={null} destination={destination} />
        </div>
        <button onClick={closeDirections}>Close</button>
        <button onClick={() => handleRouting(start, destination)}>Go</button>
    </div>
    );
  }

export default DirectionsMenu