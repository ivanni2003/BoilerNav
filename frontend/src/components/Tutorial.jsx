import React from 'react';
import { X, ArrowLeft, ArrowRight, LogIn, UserCog } from 'lucide-react';
import Draggable from 'react-draggable';

const Tutorial = ({ 
  isActive, 
  onClose, 
  currentStep = 0, 
  onNext, 
  onPrevious, 
  onLawsonClick,
  buildings,
  onCloseIndoorView,
  user,
  onViewProfile,
  onLogin,
  onCreateAccount,
  onReset
}) => {
  if (!isActive) return null;

  const lawsonBuilding = buildings.find(building => 
    building.tags && building.tags.name && 
    building.tags.name.toLowerCase().includes('lawson')
  );

  React.useEffect(() => {
    if (currentStep === 4 && lawsonBuilding) {
      onLawsonClick(lawsonBuilding);
    }
    if (currentStep !== 4 && onCloseIndoorView) {
      onCloseIndoorView();
    }
    if (currentStep === 6 && user) {
      onViewProfile();
    }
  }, [currentStep, lawsonBuilding, onCloseIndoorView, user, onViewProfile]);

  React.useEffect(() => {
    if (currentStep === 5) {
      // Make only map options and parking controls interactive
      const mapOptionsElements = document.querySelectorAll('.amenities-menu');
      const otherElements = document.querySelectorAll('.leaflet-container, .search-container, .transportation-mode');
      
      mapOptionsElements.forEach(element => {
        element.style.zIndex = '9999';
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
      });

      otherElements.forEach(element => {
        element.style.opacity = '0.3';
        element.style.pointerEvents = 'none';
      });
    } else if (currentStep === 3) {
      const mapContainer = document.querySelector('.leaflet-container');
      const searchContainer = document.querySelector('.search-container');
      const buildingMarkers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-shadow');
      const otherMapElements = document.querySelectorAll('.transportation-mode, .amenities-menu');
      
      if (mapContainer) {
        mapContainer.style.zIndex = '9999';
        mapContainer.style.pointerEvents = 'auto';
      }
      if (searchContainer) {
        searchContainer.style.zIndex = '9999';
        searchContainer.style.pointerEvents = 'auto';
      }

      buildingMarkers.forEach(marker => {
        marker.style.zIndex = '9999';
        marker.style.opacity = '1';
        marker.style.pointerEvents = 'auto';
      });

      otherMapElements.forEach(element => {
        element.style.opacity = '0.3';
        element.style.pointerEvents = 'none';
      });
    }

    return () => {
      const allElements = document.querySelectorAll('.leaflet-container, .search-container, .leaflet-marker-icon, .leaflet-marker-shadow, .transportation-mode, .amenities-menu');
      allElements.forEach(element => {
        element.style.zIndex = '';
        element.style.opacity = '';
        element.style.pointerEvents = '';
      });
    };
  }, [currentStep]);

  const steps = [
    {
      title: "Welcome to BoilerNav! 🎯",
      content: "Let's take a quick tour of all the features that will help you navigate around campus efficiently."
    },
    {
      title: "Transportation Modes", 
      content: "Choose how you want to travel! Walking provides the most direct pedestrian routes, biking shows bike-friendly paths, and bus mode helps you find and navigate bus routes around campus. Try clicking the different modes to see how they work!"
    },
    {
      title: "Finding Your Way",
      content: `You have three ways to find your destination:

1. Search directly for any location using the 'Search For Destination' bar

2. Browse and use public routes shared by other users in 'Search For Route'

3. Quick-access your favorite spots from the 'Saved Locations' box (requires login)`
    },
    {
      title: "Campus Buildings",
      content: "The golden circles on the map represent campus buildings. Click on any building to see its name and access options like indoor navigation, directions, and saving to favorites. Feel free to build a route to any building from your current location (upward facing arrow). We will explore indoor building viewer in the next stage of the tutorial"
    },
    {
      title: "Indoor Navigation 🏢",
      content: `Welcome to our indoor navigation view! Here you can:

1. Select different floors using the dropdown menu at the top
2. Click on rooms (green dots) to see room details and set navigation points
3. Search for specific rooms using the search bar
4. View popular rooms on the current floor
5. Save and access your favorite indoor routes

Try clicking on different rooms to see how the indoor navigation works!`
    },
    {
      title: "Map Options & Parking 🚗",
      content: `In the bottom left corner, you'll find additional map controls:

1. Map Options: Toggle features like automatic rerouting and bike rack visibility
2. View Parking: See and navigate to available parking lots around campus

Click on these options to explore parking locations and customize your navigation experience!`
    },
    {
      title: "User Account & Personalization 👤",
      content: user ? 
        `Your account provides several personalization features:

1. Save your favorite locations for quick access
2. Save and manage your frequently used routes
3. Control route privacy settings
4. Submit and track floor plan update requests
5. Customize your profile information

Explore these features to make BoilerNav work best for you!` :
        `It looks like you're not logged in yet! To explore these features:

1. Create a free account or log in
2. Save favorite locations and routes
3. Access personalization features
4. Submit floor plan updates
5. And much more!

Would you like to create an account or log in now?`,
      showButtons: !user
    }
  ];

  const currentStepData = steps[currentStep];
  const isDraggable = currentStep === 3 || currentStep === 4 || currentStep === 6;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    background: currentStep === 3 ? 'rgba(0, 0, 0, 0.3)' : 
                currentStep === 4 ? 'rgba(0, 0, 0, 0)' :  
                currentStep === 5 ? 'rgba(0, 0, 0, 0.3)' :
                currentStep === 6 ? 'rgba(0, 0, 0, 0)' :
                'rgba(0, 0, 0, 0.5)',
    backdropFilter: currentStep === 3 || currentStep === 4 || currentStep === 6 ? 'none' : 
                   currentStep === 5 ? 'blur(4px)' : 'blur(4px)',
    zIndex: currentStep >= 3 ? 1000 : 9998,
    pointerEvents: currentStep >= 3 ? 'none' : 'auto'
  };

  const renderAuthButtons = () => {
    if (!currentStepData.showButtons) return null;

    return (
      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        <button
          onClick={onCreateAccount}
          style={{
            padding: '12px 24px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          Create Account
          <UserCog size={16} />
        </button>
        <button
          onClick={onLogin}
          style={{
            padding: '12px 24px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#1976D2'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#2196F3'}
        >
          Log In
          <LogIn size={16} />
        </button>
      </div>
    );
  };

  const dialogContent = (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      maxWidth: '400px',
      width: '90%',
      position: 'relative',
      cursor: isDraggable ? 'move' : 'default'
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px'
        }}
      >
        <X size={24} color="#666" />
      </button>

      <h2 style={{ 
        marginTop: 0,
        marginBottom: '20px',
        paddingRight: '20px'
      }}>
        {currentStepData.title}
      </h2>
      
      <p style={{
        marginBottom: '20px',
        lineHeight: 1.5,
        whiteSpace: 'pre-line'
      }}>
        {currentStepData.content}
      </p>

      {renderAuthButtons()}

      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '20px'
      }}>
        {currentStep > 0 && (
          <button 
            onClick={onPrevious}
            style={{
              padding: '12px 24px',
              background: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#d0d0d0'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          >
            <ArrowLeft size={16} />
            Previous
          </button>
        )}

        <button 
          onClick={currentStep < steps.length - 1 ? onNext : onReset}
          style={{
            padding: '12px 24px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          {currentStep < steps.length - 1 ? (
            <>
              Next
              <ArrowRight size={16} />
            </>
          ) : (
            <>
              Finish Tour
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const dialogContainer = isDraggable ? (
    <Draggable handle=".handle">
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      }}>
        <div className="handle">
          {dialogContent}
        </div>
      </div>
    </Draggable>
  ) : (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
    }}>
      {dialogContent}
    </div>
  );

  return (
    <>
      <div style={overlayStyle} />
      {dialogContainer}
    </>
  );
};

export default Tutorial;