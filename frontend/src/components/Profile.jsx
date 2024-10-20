import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Check, Trash2, Minus, Eye, EyeOff } from 'lucide-react';
import './Profile.css';

const Profile = ({ user, onClose, onUpdateUser, onLogout }) => {
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

  useEffect(() => {
    fetchFavoriteLocations();
  }, []);

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
        <div className="user-icon">
          <span>{user.name && user.name[0] ? user.name[0].toUpperCase() : '?'}</span>
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