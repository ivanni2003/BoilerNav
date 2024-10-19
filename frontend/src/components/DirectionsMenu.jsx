import React from 'react'
import SearchBar from './SearchBar'
import './DirectionsMenu.css'

const DirectionsMenu = ({ items, updateMap, updateStart, start, destination, closeDirections, handleRouting, manhattanDistance, walkingTime }) => {

    return (
    <div className="directions-menu">
        <div className="search-bar">
            <SearchBar items={items} updateMap={updateMap} updateStart={updateStart} start={start} destination={null} />
        </div>
        <div className="search-bar">
            <SearchBar items={items} updateMap={updateMap} updateStart={updateStart} start={null} destination={destination} />
        </div>
        <div className="button-container">
        <button className="directions-button" onClick={closeDirections}>Close</button>
        <button className="directions-button" onClick={() => handleRouting()}>Go</button>
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