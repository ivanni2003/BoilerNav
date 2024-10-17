import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Amenities = ({items}) => {
    const [parkingGarages, setParkingGarages] = useState([])

    useEffect(() => {
        setParkingGarages(items.filter(item => item.tags.building == 'parking'))
    }, []);

    return (
        <div>
            <button>Parking Garages</button>
            <ul>
                {parkingGarages.length > 0 ? (
                    parkingGarages.map((item, index) => (
                        <li key={index}>{item.tags.name}</li> 
                    ))
                ) : (
                    <li>No parking garages found.</li>
                )}
            </ul>
        </div>
    );
}


export default Amenities