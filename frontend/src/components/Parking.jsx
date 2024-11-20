import React, { useState, useEffect } from 'react';
import './Parking.css'
import axios from 'axios';
import PopupDropdown from './PopupDropdown'

const baseURL = 'http://localhost:3001'

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
            <div className='parking-popup'> 
                <PopupDropdown className='parking-popup' isVisible={isParkingPopupVisible} onClose={closeParkingPopup} heading={"Parking Garages"} items={namedParking} updateMap={updateMap} viewSavedRoute={null}></PopupDropdown>
            </div>
        </div>
    );
}


export default Amenities