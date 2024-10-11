import React from 'react'
import SearchBar from './SearchBar'
import './DirectionsMenu.css'

const baseURL = 'http://localhost:3001'

const DirectionsMenu = ({ items, updateMap, start, destination, closeDirections, handleRouting, manhattanDistance, walkingTime }) => {
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
        <div className="distance-info">
            {manhattanDistance && walkingTime ? (
                <>
                    <p style={{fontSize:"10px"}}><strong>Distance:</strong> {manhattanDistance} miles</p>
                    <p style={{fontSize:"10px"}}><strong>Est. Walking Time:</strong> {walkingTime} minutes</p>
                </>
            ) :
            //  : (
                // <p>Calculating directions...</p>
            // )
            <></>
            }
        </div>
    </div>
    );
  }

export default DirectionsMenu