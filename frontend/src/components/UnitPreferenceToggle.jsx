import { useState } from 'react';

const UnitPreferenceToggle = ({ currentPreference, onPreferenceChange }) => {
  const [isMetric, setIsMetric] = useState(currentPreference === 'metric');

  const handleToggle = () => {
    const newPreference = isMetric ? 'imperial' : 'metric';
    setIsMetric(!isMetric);
    onPreferenceChange(newPreference);
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: 'white',
    marginTop: '10px',
    marginBottom: '10px',
    width: '90%'
  };

  const textContainerStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const titleStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  };

  const subtitleStyle = {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  };

  const toggleContainerStyle = {
    position: 'relative',
    width: '44px',
    height: '24px'
  };

  const toggleButtonStyle = {
    position: 'relative',
    width: '44px',
    height: '24px',
    backgroundColor: isMetric ? '#4CAF50' : '#ccc',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: 'none',
    padding: 0
  };

  const toggleKnobStyle = {
    position: 'absolute',
    top: '2px',
    left: isMetric ? '22px' : '2px',
    width: '20px',
    height: '20px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
  };

  return (
    <div style={containerStyle}>
      <div style={textContainerStyle}>
        <span style={titleStyle}>Distance Unit Preference</span>
        <span style={subtitleStyle}>
          {isMetric ? 'Using Metric (kilometers)' : 'Using Imperial (miles)'}
        </span>
      </div>
      <div style={toggleContainerStyle}>
        <button
          onClick={handleToggle}
          style={toggleButtonStyle}
          aria-label="Toggle unit preference"
        >
          <div style={toggleKnobStyle} />
        </button>
      </div>
    </div>
  );
};

export default UnitPreferenceToggle;