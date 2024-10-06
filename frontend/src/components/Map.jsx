import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

const MapViewUpdater = ({ latitude, longitude, zoom }) => {
    const map = useMap(); 

    useEffect(() => {
        map.setView([latitude, longitude], zoom); 
    }, [latitude, longitude, zoom, map]); 
};

const Map = ({ latitude, longitude, zoom}) => {
    return (
        <MapContainer 
            center={[latitude, longitude]} 
            zoom={zoom} 
            className="map-container" 
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapViewUpdater latitude={latitude} longitude={longitude} zoom={zoom} /> {/* Include the updater */}
        </MapContainer>
    );
};

export default Map;