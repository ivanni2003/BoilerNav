import React from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

const Tutorial = ({ isActive, onClose, currentStep = 0, onNext, onPrevious }) => {
  if (!isActive) return null;

  const steps = [
    {
      title: "Welcome to BoilerNav! 🎯",
      content: "Let's take a quick tour of all the features that will help you navigate around campus efficiently.",
    },
    {
      title: "Transportation Modes",
      content: "Choose how you want to travel! Walking provides the most direct pedestrian routes, biking shows bike-friendly paths, and bus mode helps you find and navigate bus routes around campus. Try clicking the different modes to see how they work!",
    },
    {
      title: "Finding Your Way",
      content: 
`You have three ways to find your destination:

1. Search directly for any location using the 'Search For Destination' bar

2. Browse and use public routes shared by other users in 'Search For Route'

3. Quick-access your favorite spots from the 'Saved Locations' box (requires login)`
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Full screen overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998
      }} />

      {/* Tutorial Box */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '400px',
        width: '90%'
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
          lineHeight: 1.5
        }}>
          {currentStepData.content}
        </p>

        {/* Navigation Buttons Container */}
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
            onClick={onNext}
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
            Next
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Tutorial;