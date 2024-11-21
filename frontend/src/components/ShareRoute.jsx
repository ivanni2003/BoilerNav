import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";

const ShareRoute = ({ 
    userLocation, 
    handleRouting,
    setStart,
    setDestination,
    setActiveMenu
  }) => {
    const location = useLocation();
    const [hasRouted, setHasRouted] = useState(false);
    useEffect(() => {
        if (hasRouted) return;
        const queryParams = new URLSearchParams(location.search);
    
        if ([...queryParams].length > 0) {
          // Run function if there are arguments in the URL
          myFunction(queryParams);
        }
      }, [location.search, userLocation]); // Dependency on `location.search` to detect URL changes
    
      const myFunction = (params) => {
        console.log("URL arguments:", Object.fromEntries(params));
        const lat = params.get('lat');
        const lon = params.get('lon');
        const nam = params.get('nam');
        if (lat && lon && nam && userLocation) {
            const destinationBuilding = {
              buildingPosition: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
              },
              tags: {
                name: nam,
              },
            };
        
            console.log("Destination Building:", destinationBuilding);
            console.log("userLocation: ", userLocation)
            setDestination(destinationBuilding);
            setStart(userLocation);
            setActiveMenu('directions');
            //handleRouting();
            setHasRouted(true);
        }
      };
      return null;
    }

export default ShareRoute;
