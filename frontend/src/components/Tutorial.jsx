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

  const resetAllElements = () => {
    const allElements = document.querySelectorAll(
      '.search-container, .transportation-mode, .amenities-menu, ' +
      '.app-header, .logo-title, .burger-menu, .leaflet-container, ' +
      '.map-container, .content'
    );
    
    allElements.forEach(element => {
      if (element) {
        element.style.zIndex = '';
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        element.style.filter = 'none';
        element.style.cursor = element.classList.contains('logo-title') ? 'pointer' : 'auto';
      }
    });

    const contentDiv = document.querySelector('.content');
    if (contentDiv) {
      contentDiv.style.filter = 'none';
      contentDiv.style.pointerEvents = 'auto';
    }

    document.body.style.overflow = 'hidden';
  };

  const lawsonBuilding = buildings.find(building => 
    building.tags && building.tags.name && 
    building.tags.name.toLowerCase().includes('lawson')
  );

  React.useEffect(() => {
    if (currentStep === 5 && lawsonBuilding) {
      onLawsonClick(lawsonBuilding);
    }
    if (currentStep !== 5 && onCloseIndoorView) {
      onCloseIndoorView();
    }
    if (currentStep === 6 && user) {
      onViewProfile();
      const profileView = document.querySelector('.profile-view');
      if (profileView) {
        profileView.style.opacity = '1';
        profileView.style.pointerEvents = 'auto';
        profileView.style.zIndex = '1001';
      }
      // Also make the entire content area interactive for the profile view
      const contentArea = document.querySelector('.content');
      if (contentArea) {
        contentArea.style.opacity = '1';
        contentArea.style.pointerEvents = 'auto';
        contentArea.style.filter = 'none';
      }
    }

    return () => {
      resetAllElements();
    };
  }, [currentStep, lawsonBuilding, onCloseIndoorView, user, onViewProfile]);

  React.useEffect(() => {
    const highlightElement = (selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element) {
          element.style.zIndex = '1001';
          element.style.opacity = '1';
          element.style.pointerEvents = 'auto';
        }
      });
    };
  
    resetAllElements();
  
    // Don't apply blur effect if we're on the profile step and user is logged in
    if (!(currentStep === 6 && user)) {
      let dimSelectors;
      switch (currentStep) {
        case 1:
          dimSelectors = '.transportation-mode, .amenities-menu, .app-header, .logo-title, .burger-menu, .leaflet-container';
          break;
        case 2:
          dimSelectors = '.search-container, .amenities-menu, .app-header, .logo-title, .burger-menu, .leaflet-container';
          break;
        default:
          dimSelectors = '.search-container, .transportation-mode, .amenities-menu, .app-header, .logo-title, .burger-menu, .leaflet-container';
      }
      
      const allElements = document.querySelectorAll(dimSelectors);
      allElements.forEach(element => {
        if (element) {
          element.style.opacity = '0.7';
          element.style.pointerEvents = 'none';
        }
      });
    }

    switch (currentStep) {
      case 1:
        highlightElement('.search-container');
        break;
      case 2:
        highlightElement('.transportation-mode');
        break;
      case 3:
        highlightElement('.amenities-menu');
        break;
      case 4:
        const interactiveElements = document.querySelectorAll('.leaflet-container, .map-container, .search-container');
        interactiveElements.forEach(element => {
          if (element) {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            element.style.zIndex = '1001';
          }
        });
        break;
        case 6:
          // For step 6, make everything except the tutorial overlay interactive
          if (user) {
            const elements = document.querySelectorAll('body > *:not(.tutorial-overlay)');
            elements.forEach(element => {
              element.style.opacity = '1';
              element.style.pointerEvents = 'auto';
              element.style.filter = 'none';
              element.style.zIndex = '';
            });
          }
          break;
      default:
        break;
    }

    return () => {
      resetAllElements();
    };
  }, [currentStep, user]);

  const handleCloseOrFinish = () => {
    resetAllElements();
    onClose();
    
    if (currentStep === steps.length - 1) {
      onReset();
    }
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: '90%',
    width: '100vw',
    height: '100vh',
    background: currentStep === 6 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    pointerEvents: currentStep === 6 ? 'none' : 'all'
  };

  const steps = [
    {
      title: "Welcome to BoilerNav! 🎯",
      content: "Let's take a quick tour of all the features that will help you navigate around campus efficiently."
    },
    {
      title: "Finding Your Way 🔍",
      content: `You have three ways to find your destination:

1. Search directly for any location using the 'Search For Destination' bar

2. Browse and use public routes shared by other users in 'Search For Route'

3. Quick-access your favorite spots from the 'Saved Locations' box (requires login)`
    },
    {
      title: "Transportation Modes 🚶‍♂️",
      content: "Choose how you want to travel! Walking provides the most direct pedestrian routes, biking shows bike-friendly paths, and bus mode helps you find and navigate bus routes around campus. Try clicking the different modes to see how they work!"
    },
    {
      title: "Map Options & Parking 🚗",
      content: `In the bottom left corner, you'll find additional map controls:

1. Map Options: Toggle features like automatic rerouting and bike rack visibility
2. View Parking: See and navigate to available parking lots around campus

Click on these options to explore parking locations and customize your navigation experience!`
    },
    {
      title: "Campus Buildings 🏛️",
      content: "The golden circles on the map represent campus buildings. You can either click on any building to see its details and options, or use the search bars to find specific locations and routes. Feel free to try creating a route either by clicking buildings or searching! When you're ready, we'll explore indoor navigation next."
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
  const isDraggable = currentStep === 4 || currentStep === 5 || currentStep === 6;
  
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
        onClick={handleCloseOrFinish}
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
          onClick={currentStep < steps.length - 1 ? onNext : handleCloseOrFinish}
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
      <div style={overlayStyle} className="tutorial-overlay" />
      {dialogContainer}
    </>
);
};

export default Tutorial;