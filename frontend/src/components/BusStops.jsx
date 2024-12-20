import React, { useState, useEffect } from 'react';
import './BusStops.css'
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

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
}


export default BusStops