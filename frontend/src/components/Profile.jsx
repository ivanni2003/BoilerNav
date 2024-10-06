import React, { useState } from 'react';
import axios from 'axios';
import { Pencil, Check } from 'lucide-react';
import './Profile.css';

const Profile = ({ user, onClose, onUpdateUser }) => {
  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    major: false,
    affiliation: false
  });
  const [editedUser, setEditedUser] = useState({ ...user });

  const toggleEdit = (field) => {
    setEditMode({ ...editMode, [field]: !editMode[field] });
  };

  const handleChange = (e, field) => {
    setEditedUser({ ...editedUser, [field]: e.target.value });
  };

  const handleSave = async (field) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/users/${user.id}`, {
        [field]: editedUser[field]
      });
      if (response.status === 200) {
        onUpdateUser({ ...user, [field]: editedUser[field] });
        toggleEdit(field);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      // Optionally, add error handling here (e.g., show an error message to the user)
    }
  };

  const renderField = (label, field) => (
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

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>User Profile</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="profile-content">
        <div className="user-icon">
          <span>{user.name[0].toUpperCase()}</span>
        </div>
        <div className="user-info">
          {renderField("Full Name", "name")}
          <p><strong>Username:</strong> {user.username}</p>
          {renderField("Email", "email")}
          {renderField("Major", "major")}
          {renderField("Affiliation", "affiliation")}
        </div>
      </div>
    </div>
  );
};

export default Profile;