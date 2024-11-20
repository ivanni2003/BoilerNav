import React, { useState, useEffect } from 'react';
import './PopupDropdown.css'

const PopupDropdown = ({isVisible, onClose, heading, items, updateMap, viewSavedRoute}) => {
    if (!isVisible) {
        return null
    }

    const handleItemClick = (item) => {
        if (updateMap) {
            updateMap(item.buildingPosition.lat, item.buildingPosition.lon, 20)
        }
        else {
            viewSavedRoute(item)
        }
    }

    return (
        <div>
            <div className="popup-content">
            <span className="close" onClick={onClose}>&times;</span>
                <h2 style={{ fontSize: '18px'}}>{heading}</h2>
                <ul className="popup-items">
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <ul className="popup-item" onClick={() => handleItemClick(item)} key={index}>
                                {updateMap ? item.tags.name : `${item.startLocation.name} to ${item.endLocation.name}`}
                            </ul>
                        ))
                    ) : (
                        <ul>No items found.</ul>
                    )}
                </ul>
            </div>
        </div>
    )

}

export default PopupDropdown