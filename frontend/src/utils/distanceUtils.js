// Add conversion factors
const KM_TO_MILES = 0.621371;
const METERS_TO_FEET = 3.28084;

export const convertDistance = (distance, fromUnit, toUnit) => {
  // Return null if distance is invalid
  if (distance == null || isNaN(Number(distance))) return null;
  
  // Convert distance to number
  const numDistance = Number(distance);
  
  if (fromUnit === toUnit) return numDistance;

  switch (fromUnit + '_to_' + toUnit) {
    case 'km_to_miles':
      return numDistance * KM_TO_MILES;
    case 'miles_to_km':
      return numDistance / KM_TO_MILES;
    case 'meters_to_feet':
      return numDistance * METERS_TO_FEET;
    case 'feet_to_meters':
      return numDistance / METERS_TO_FEET;
    default:
      return numDistance;
  }
};

export const formatDistance = (distance, unit, includeUnit = true) => {
  // Return 'N/A' if distance is invalid
  if (distance == null || isNaN(Number(distance))) {
    return 'N/A';
  }

  // Convert to number and format
  const numDistance = Number(distance);
  const formattedDistance = numDistance.toFixed(2);
  
  if (!includeUnit) return formattedDistance;
  
  switch (unit) {
    case 'metric':
      return `${formattedDistance} km`;
    case 'imperial':
      return `${formattedDistance} m`;
    default:
      return `${formattedDistance}`;
  }
};

export const formatIndoorDistance = (distanceInMeters, unit) => {
  if (distanceInMeters == null || isNaN(Number(distanceInMeters))) {
    return 'N/A';
  }

  const numDistance = Number(distanceInMeters);
  
  if (unit === 'imperial') {
    const feet = convertDistance(numDistance, 'meters', 'feet');
    return `${feet.toFixed(2)} ft`;
  }
  
  return `${numDistance.toFixed(2)} m`;
};