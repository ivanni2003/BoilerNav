import React, { useState, useEffect } from 'react';
import './BusStops.css'
import axios from 'axios';

const baseURL = 'http://localhost:3001'

const BusStops = ({updateMap, markBusStops}) => {
    const [busStops, setBusStops] = useState([])
    const [namedBusStops, setNamedBusStops] = useState([])
    const [isBusStopsPopupVisible, setIsBusStopsPopupVisible] = useState(false)


    useEffect(() => {
        const fetchBusStops = async () => {
            try {
                const response = await axios.get(`${baseURL}/api/nodes/bus-stops`);
                setBusStops(response.data); 
                setNamedBusStops(response.data.filter(stop => stop.tags.name));
            } catch (error) {
                // console.error(error);
            }

        };

        fetchBusStops();
    }, [markBusStops]); 

    // const handleBusStopsClick = () => {
    //     setIsBusStopsPopupVisible(!isBusStopsPopupVisible);
    //     markBusStops(busStops);
    // };

    // const closeBusStopsPopup = () => {
    //     setIsBusStopsPopupVisible(false);
    //     markBusStops([])
    // };

    // return (
    //     <div>
    //         <button className='busstops-button' onClick={handleBusStopsClick}>View Bus Stops</button>
    //     </div>
    // );
}


export default BusStops