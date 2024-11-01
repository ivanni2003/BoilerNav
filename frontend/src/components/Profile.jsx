import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Check, Trash2, Minus, Eye, EyeOff, Map, Lock, Unlock, Info  } from 'lucide-react';
import './Profile.css';

const Profile = ({ user, onClose, onUpdateUser, onLogout, showNotification, onViewSavedRoute, updatePublicRoutes }) => {
  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    major: false,
    affiliation: false,
    username: false,
    password: false
  });

  const [editedUser, setEditedUser] = useState({ ...user, password: '' });
  const [error, setError] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [isAllRoutesPublic, setIsAllRoutesPublic] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  useEffect(() => {
    fetchFavoriteLocations();
    fetchSavedRoutes();
  }, []);
  useEffect(() => {
    if (savedRoutes.length > 0) {
      const allPublic = savedRoutes.every(route => route.isPublic);
      setIsAllRoutesPublic(allPublic);
    }
  }, [savedRoutes]);

  const handleGlobalPrivacyToggle = async () => {
    setIsUpdatingPrivacy(true);
    const newPrivacyStatus = !isAllRoutesPublic;

    try {
      // Update all routes in the database
      const updatePromises = savedRoutes.map(route =>
        axios.patch(
          `http://localhost:3001/api/routes/${route._id}/privacy`,
          { isPublic: newPrivacyStatus },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        )
      );

      await Promise.all(updatePromises);

      // Update local state
      setSavedRoutes(prevRoutes =>
        prevRoutes.map(route => ({
          ...route,
          isPublic: newPrivacyStatus
        }))
      );

      updatePublicRoutes() // update public routes available for search
      setIsAllRoutesPublic(newPrivacyStatus);
      
      showNotification(
        `All routes are now ${newPrivacyStatus ? 'public' : 'private'}`,
        'success'
      );
    } catch (error) {
      console.error('Error updating routes privacy:', error);
      showNotification('Failed to update routes privacy', 'error');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const fetchFavoriteLocations = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/users/${user.id}/favorites`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFavoriteLocations(response.data);
    } catch (error) {
      console.error('Error fetching favorite locations:', error);
      setError('Failed to fetch favorite locations');
    }
  };

  const fetchSavedRoutes = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/routes/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSavedRoutes(response.data);
    } catch (error) {
      console.error('Error fetching saved routes:', error);
      setError('Failed to fetch saved routes');
    }
  };

  const handleRemoveFavorite = async (buildingId) => {
    try {
      await axios.delete(`http://localhost:3001/api/users/${user.id}/favorites/${buildingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFavoriteLocations(prevFavorites => prevFavorites.filter(fav => fav.buildingId !== buildingId));
    } catch (error) {
      console.error('Error removing favorite location:', error);
      setError('Failed to remove favorite location');
    }
  };

  const handleRemoveRoute = async (routeId) => {
    try {
      await axios.delete(`http://localhost:3001/api/routes/${routeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSavedRoutes(prevRoutes => prevRoutes.filter(route => route._id !== routeId));
      showNotification('Route removed successfully', 'success');
    } catch (error) {
      console.error('Error removing saved route:', error);
      showNotification('Failed to remove saved route', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      if (!user.id) {
        throw new Error('User ID is missing. Please log out and log in again.');
      }

      const response = await axios.delete(`http://localhost:3001/api/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 204) {
        onLogout();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.response) {
        console.error(error.response.data);
        console.error(error.response.status);
        console.error(error.response.headers);
        setError(`Error ${error.response.status}: ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        console.error(error.request);
        setError('No response received from server. Please try again.');
      } else {
        console.error('Error', error.message);
        setError(error.message || 'An unknown error occurred');
      }
    }
  };

  const affiliationOptions = [
    { value: "student", label: "Student" },
    { value: "faculty", label: "Faculty" },
    { value: "staff", label: "Staff" },
    { value: "alumni", label: "Alumni" },
    { value: "other", label: "Other" }
  ];

  const toggleEdit = (field) => {
    setEditMode({ ...editMode, [field]: !editMode[field] });
    setError(''); // Clear any previous errors when toggling edit mode
  };

  const handleChange = (e, field) => {
    setEditedUser({ ...editedUser, [field]: e.target.value });
  };

  const handleSave = async (field) => {
    try {
      if (!user.id) {
        throw new Error('User ID is missing. Please log out and log in again.');
      }
      const response = await axios.put(`http://localhost:3001/api/users/${user.id}`, {
        [field]: editedUser[field]
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.status === 200) {
        onUpdateUser({ ...user, [field]: editedUser[field] });
        toggleEdit(field);
        if (field === 'password') {
          setEditedUser({ ...editedUser, password: '' });
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.error || error.message || 'An error occurred while updating. Please try again.');
    }
  };

  const renderField = (label, field) => {
    if (field === 'affiliation') {
      return (
        <div className="user-info-field">
          <strong>{label}:</strong> 
          {editMode[field] ? (
            <>
              <select
                value={editedUser[field]}
                onChange={(e) => handleChange(e, field)}
              >
                {affiliationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Check onClick={() => handleSave(field)} className="edit-icon" />
            </>
          ) : (
            <>
              {affiliationOptions.find(option => option.value === user[field])?.label || user[field]}
              <Pencil onClick={() => toggleEdit(field)} className="edit-icon" />
            </>
          )}
        </div>
      );
    }

    if (field === 'password') {
      return (
        <div className="user-info-field">
          <strong>{label}:</strong> 
          {editMode[field] ? (
            <>
              <input
                type={showPassword ? "text" : "password"}
                value={editedUser[field]}
                onChange={(e) => handleChange(e, field)}
              />
              {showPassword ? (
                <EyeOff onClick={() => setShowPassword(false)} className="edit-icon" />
              ) : (
                <Eye onClick={() => setShowPassword(true)} className="edit-icon" />
              )}
              <Check onClick={() => handleSave(field)} className="edit-icon" />
            </>
          ) : (
            <>
              ••••••••
              <Pencil onClick={() => toggleEdit(field)} className="edit-icon" />
            </>
          )}
        </div>
      );
    }

    return (
      <div className="user-info-field">
        <strong>{label}:</strong> 
        {editMode[field] ? (
          <>
            <input
              type="text"
              value={editedUser[field]}
              onChange={(e) => handleChange(e, field)}
            />
            <Check onClick={() => handleSave(field)} className="edit-icon" />
          </>
        ) : (
          <>
            {user[field]}
            <Pencil onClick={() => toggleEdit(field)} className="edit-icon" />
          </>
        )}
      </div>
    );
  };

  const RenderRouteDurationInput = ({route}) => {
    const [duration, setDuration] = useState(route.duration || '');
    const handleDurationChange = (e) => {
      setDuration(e.target.value);
    };
    const handleUpdateDuration = async () => {
      let durationAsNumber = -1;
      try {
        durationAsNumber = parseFloat(duration);
      } catch (error) {
        console.error('Error parsing duration:', error);
        showNotification('Invalid duration value', 'error');
        return;
      }
      if (durationAsNumber < 0) {
        showNotification('Duration must be a positive number', 'error');
        return;
      }
      try {
        const updatedRoute = await axios.patch(
          `http://localhost:3001/api/routes/${route._id}/duration`,
          { duration: durationAsNumber },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setSavedRoutes(prevRoutes =>
          prevRoutes.map(r => (r._id === route._id ? updatedRoute.data : r))
        );
        showNotification('Route duration updated successfully', 'success');
      } catch (error) {
        console.error('Error updating route duration:', error);
        showNotification('Failed to update route duration', 'error');
      }
    }
    return (
      <div className="route-duration">
        <input
          type="number"
          value={duration}
          onChange={handleDurationChange}
          placeholder="Duration (minutes)"
          style={{ width: '60px' }}
        />
        <button onClick={handleUpdateDuration}>
          <Check size={16} />
        </button>
      </div>
    );
  }

  if (!user) {
    return <div className="profile-container">Loading user data...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>User Profile</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="profile-content">
      <div className="user-icon-container">
          <div className="user-icon">
            <span>{user.name && user.name[0] ? user.name[0].toUpperCase() : '?'}</span>
          </div>
      </div>
        <div className="user-info">
          {renderField("Full Name", "name")}
          {renderField("Username", "username")}
          {renderField("Password", "password")}
          {renderField("Email", "email")}
          {renderField("Major", "major")}
          {renderField("Affiliation", "affiliation")}
        </div>
        <div className="favorite-locations">
          <h3>Saved Locations</h3>
          <div className="favorite-locations-list">
            {favoriteLocations.length > 0 ? (
              favoriteLocations.map((location) => (
                <div key={location.buildingId} className="favorite-location-item">
                  <span>{location.name}</span>
                  <button 
                    onClick={() => handleRemoveFavorite(location.buildingId)}
                    className="remove-favorite-button"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-favorites-message">Your saved locations will appear here</p>
            )}
          </div>
        </div>
        <div className="saved-routes">
        <div className="saved-routes-header">
          <h3>Saved Routes</h3>
          <div className="global-privacy-control">
            <div className="privacy-toggle-container">
              <button
                className={`privacy-toggle-button ${isUpdatingPrivacy ? 'disabled' : ''}`}
                onClick={handleGlobalPrivacyToggle}
                disabled={isUpdatingPrivacy || savedRoutes.length === 0}
                title={`Make all routes ${isAllRoutesPublic ? 'private' : 'public'}`}
              >
                {isAllRoutesPublic ? (
                  <>
                    <Unlock size={16} />
                    <span>All Routes Public</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>All Routes Private</span>
                  </>
                )}
              </button>
              <div className="info-tooltip-container">
                <Info 
                  size={16} 
                  className="info-icon"
                  aria-label="Privacy information"
                />
                <div className="info-tooltip">
                  By default, your saved routes are public
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="saved-routes-list">
          {savedRoutes.length > 0 ? (
            savedRoutes.map((route) => (
              <div key={route._id} className="saved-route-item">
                <div className="route-info">
                  <span>
                    {route.startLocation?.name || 'Unknown'} to {route.endLocation?.name || 'Unknown'}
                    {' '}({route.distance?.toFixed(2) || 'N/A'} miles, {route.duration?.toFixed(0) || 'N/A'} min)
                  </span>
                </div>
                <div className="route-actions">
                  <button onClick={() => onViewSavedRoute(route)}>
                    <Map size={16} />
                  </button>
                  <button onClick={() => handleRemoveRoute(route._id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <RenderRouteDurationInput route={route} />
              </div>
            ))
          ) : (
            <p className="empty-routes-message">Your saved routes will appear here</p>
          )}
        </div>
      </div>
        <div className="delete-account-section">
        {!showDeleteConfirmation ? (
          <button className="delete-account-button" onClick={() => setShowDeleteConfirmation(true)}>
            <Trash2 size={16} />
            Delete Account
          </button>
        ) : (
          <div className="delete-confirmation">
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <button className="confirm-delete-button" onClick={handleDeleteAccount}>
              Yes, Delete My Account
            </button>
            <button className="cancel-delete-button" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default Profile;
