import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle} from 'react-leaflet';

const Map = ({nodes, ways, relations, userLocation, accuracy}) => {
    return (
        <MapContainer center={[40.4274, -86.9132]} zoom={13} style={{ height: "600px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
           {userLocation && (
                <>
                    <Marker position={userLocation}></Marker>
                    {accuracy && (
                        <Circle
                            center={userLocation}
                            radius={accuracy} // Accuracy in meters
                            color="blue"
                            fillColor="blue"
                            fillOpacity={0.2}
                        />
                    )}
                </>
            )}
            {nodes.map(node => (
                <Marker key={node.id} position={[node.lat, node.lon]} />
            ))}
            {ways.map(way => {
                const latLngs = way.nodes.map(nodeId => {
                const node = nodes.find(n => n.id === nodeId);
                return [node.lat, node.lon];
            });
                return <Polyline key={way.id} positions={latLngs} color="blue" />;
            })}
            
        
        </MapContainer>
    )
}

export default Map