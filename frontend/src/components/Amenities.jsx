import React, { useState, useEffect } from 'react';
import './Amenities.css'
import axios from 'axios';

const baseURL = 'http://localhost:3001'

const Popup = ({isVisible, onClose, heading, items, updateMap}) => {
    if (!isVisible) {
        return null
    }

    const handleItemClick = (item) => {
        updateMap(item.buildingPosition.lat, item.buildingPosition.lon, 20)
    }

    return (
        <div className="amenity-popup">
            <div className="popup-content">
            <span className="close" onClick={onClose}>&times;</span>
                <h2 style={{ fontSize: '18px'}}>{heading}</h2>
                <ul className="popup-items">
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <ul className="popup-item" onClick={() => handleItemClick(item)} key={index}>
                                {item.tags.name ? item.tags.name : 'Unnamed'}
                            </ul>
                        ))
                    ) : (
                        <ul>No parking garages found.</ul>
                    )}
                </ul>
            </div>
        </div>
    )

}
const Amenities = ({updateMap, markParkingLots}) => {
    const [parkingLots, setParkingLots] = useState([])
    const [namedParking, setNamedParking] = useState([])
    const [isParkingPopupVisible, setIsParkingPopupVisible] = useState(false)


    useEffect(() => {
        const fetchParkingLots = async () => {
            try {
                const response = await axios.get(`${baseURL}/api/ways/parkinglots`);
                setParkingLots(response.data); 
                setNamedParking(response.data.filter(lot => lot.tags.name))
            } catch (error) {
                console.error(error);
            }

        };

        fetchParkingLots();
    }, []); 

    const handleParkingClick = () => {
        setIsParkingPopupVisible(true);
        markParkingLots(parkingLots);
    };

    const closeParkingPopup = () => {
        setIsParkingPopupVisible(false);
        markParkingLots([])
    };

    return (
        <div>
            <button className='feature-button' onClick={handleParkingClick}>View Parking</button>
            <Popup isVisible={isParkingPopupVisible} onClose={closeParkingPopup} heading={"Parking Garages"} items={namedParking} updateMap={updateMap}></Popup>
        </div>
    );
}


export default Amenities