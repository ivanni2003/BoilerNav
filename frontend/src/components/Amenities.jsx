import React, { useState, useEffect } from 'react';
import './Amenities.css'
import axios from 'axios';

const Amenities = ({items, updateMap}) => {
    const [parkingGarages, setParkingGarages] = useState([])

    useEffect(() => {
        setParkingGarages(items.filter(item => item.tags.building == 'parking'))
    }, []);

    const handleParkingClick = () => {
        
    }

    return (
        <div>
            <button className='amenity-button' onClick={handleParkingClick}>Parking Garages</button>
           {/* <ul>
                {parkingGarages.length > 0 ? (
                    parkingGarages.map((item, index) => (
                        <li key={index}>{item.tags.name}</li> 
                    ))
                ) : (
                    <li>No parking garages found.</li>
                )}
            </ul>  */ }
        </div>
    );
}


export default Amenities