import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Check, Trash2, Minus, Eye, EyeOff, Map, Lock, Unlock, Info  } from 'lucide-react';
import './Profile.css';

const baseURL = process.env.API_BASE_URL;

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
  const [isElevated, setIsElevated] = useState(user.isElevated);

  // State for Ban Panel
  const [showBanPanel, setShowBanPanel] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const [showSubmissionsPopup, setShowSubmissionsPopup] = useState(false);

  const [banUnbanMessage, setBanUnbanMessage] = useState('');

  const [selectedUserSubmissions, setSelectedUserSubmissions] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState('');

  const [showUpdateRequests, setShowUpdateRequests] = useState(false);
  const [updateRequests, setUpdateRequests] = useState([]);
  const [floorPlanRequests, setFloorPlanRequests] = useState([]);

  useEffect(() => {   // prevent scrolling in user menu
    document.body.style.overflow = 'hidden';
  }, []); 

  const handleApproveFloorPlanRequest = async (request) => {
    try {
      await axios.post(`${baseURL}/api/indoordata/approve-floor-plan-request`, { request }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showNotification('Floor plan request approved', 'success');
      setFloorPlanRequests(prev => prev.filter(r => r.requestId !== request.requestId));
    } catch (error) {
      console.error('Error approving floor plan request:', error);
      showNotification('Failed to approve floor plan request', 'error');
    }
  };

  const handleDeclineFloorPlanRequest = async (request) => {
    try {
      await axios.post(`${baseURL}/api/indoordata/decline-floor-plan-request`, { request }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showNotification('Floor plan request declined', 'success');
      setFloorPlanRequests(prev => prev.filter(r => r.requestId !== request.requestId));
    } catch (error) {
      console.error('Error declining floor plan request:', error);
      showNotification('Failed to decline floor plan request', 'error');
    }
  };

  // Open Review Update Requests
  const handleOpenReviewUpdateRequests = () => {
    setShowUpdateRequests(true);
  };

  // Close Ban Panel
  const handleCloseReviewUpdateRequests = () => {
    // setBanUnbanMessage('');
    setShowUpdateRequests(false);
  };

  // Fetch all users except the logged-in user when Ban Panel is opened
  useEffect(() => {
    if (showUpdateRequests) {
      // setBanUnbanMessage('');
      fetchUpdateRequests();
    }
  }, [showUpdateRequests]);

  const fetchUpdateRequests = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/indoordata/get-update-requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          username: user ? user.username : 'Guest'
        }
      });
      setUpdateRequests(response.data.updateRequests || []);
      setFloorPlanRequests(response.data.floorPlanRequests || []);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      showNotification('Failed to fetch update requests', 'error');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await axios.post(`${baseURL}/api/indoordata/approve-update-request/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showNotification('Update request approved', 'success');
      setUpdateRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error approving update request:', error);
      showNotification('Failed to approve update request', 'error');
    }
  };
  
  const handleDeclineRequest = async (requestId) => {
    try {
      await axios.delete(`${baseURL}/api/indoordata/update-request/${requestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showNotification('Update request declined', 'success');
      setUpdateRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error declining update request:', error);
      showNotification('Failed to decline update request', 'error');
    }
  };

  const handleViewSubmissions = async (username) => {
    try {
      const response = await axios.get(`${baseURL}/api/users/username/${username}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
  
      const user = response.data;
      if (user.floorPlanRequests && user.floorPlanRequests.length > 0) {
        setSelectedUserSubmissions(user.floorPlanRequests);
      } else {
        setSelectedUserSubmissions([]);
      }
      setSelectedUsername(username);
      setShowSubmissionsPopup(true);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      showNotification('Failed to fetch user submissions', 'error');
    }
  };

  // Function to close Submissions Popup
  const handleCloseSubmissionsPopup = () => {
    setShowSubmissionsPopup(false);
  };

  // Open Ban Panel
  const handleOpenBanPanel = () => {
    setShowBanPanel(true);
  };

  // Close Ban Panel
  const handleCloseBanPanel = () => {
    setBanUnbanMessage('');
    setShowBanPanel(false);
  };

  // Fetch all users except the logged-in user when Ban Panel is opened
  useEffect(() => {
    if (showBanPanel) {
      setBanUnbanMessage('');
      fetchAllUsers();
    }
  }, [showBanPanel]);

  const fetchAllUsers = async () => {
    try {
      console.log("Getting users")
      const response = await axios.get(`${baseURL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log("reponse: ", response)
      // Exclude the logged-in user
      const users = response.data.filter(u => u.id !== user.id);
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  };

  // Handle banning a user
  const handleBanUser = async (username) => {
    try {
      await axios.post(
        `${baseURL}/api/users/ban`,
        { username },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setBanUnbanMessage('BAN SUCCESS!');
      // Update the user's isBanned status locally
      setAllUsers(prevUsers =>
        prevUsers.map(user => (user.username === username ? { ...user, isBanned: true } : user))
      );
    } catch (error) {
      console.error('Error banning user:', error);
      const errorMessage = error.response?.data?.error || 'An error occurred while banning the user.';
      setBanUnbanMessage(errorMessage);
    }
  };

  // Handle unbanning a user
  const handleUnbanUser = async (username) => {
    try {
      await axios.post(
        `${baseURL}/api/users/unban`,
        { username },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      showNotification(`User ${username} has been unbanned.`, 'success');
      // Update the user's isBanned status locally
      setAllUsers(prevUsers =>
        prevUsers.map(user => (user.username === username ? { ...user, isBanned: false } : user))
      );
      setBanUnbanMessage("UNBAN SUCCESS!");
    } catch (error) {
      console.error('Error unbanning user:', error);
      showNotification('An error occurred while unbanning the user.', 'error');
      const errorMessage = error.response?.data?.error || 'An error occurred while banning the user.';
      setBanUnbanMessage(errorMessage);
    }
  };

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

  useEffect(() => {
    setIsElevated(user.isElevated); // this might cause a infinite loop?
    // here is where i want to set the visibility of the "open ban panel button"
  }, [isElevated]);

  const handleGlobalPrivacyToggle = async () => {
    setIsUpdatingPrivacy(true);
    const newPrivacyStatus = !isAllRoutesPublic;

    try {
      // Update all routes in the database
      const updatePromises = savedRoutes.map(route =>
        axios.patch(
          `${baseURL}/api/routes/${route._id}/privacy`,
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
      const response = await axios.get(`${baseURL}/api/users/${user.id}/favorites`, {
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
      const response = await axios.get(`${baseURL}/api/routes/${user.id}`, {
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
      await axios.delete(`${baseURL}/api/users/${user.id}/favorites/${buildingId}`, {
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
      await axios.delete(`${baseURL}/api/routes/${routeId}`, {
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

      const response = await axios.delete(`${baseURL}/api/users/${user.id}`, {
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
      const response = await axios.put(`${baseURL}/api/users/${user.id}`, {
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
          `${baseURL}/api/routes/${route._id}/duration`,
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

  const handleViewRoute = async (route) => {
    if (route.travelMode === 'indoor') {
      try {
        // Fetch building data
        const response = await axios.get(`${baseURL}/api/ways/buildings`);
        const buildings = response.data;
        const building = buildings.find(b => b.id === route.buildingId);
        
        if (!building) {
          showNotification('Building not found', 'error');
          return;
        }

        // Fetch floor plans
        const floorPlansResponse = await axios.get(`${baseURL}/api/floorplans/building/${building.id}`);
        
        if (!floorPlansResponse.data || floorPlansResponse.data.length === 0) {
          showNotification('No floor plans available for this building', 'info');
          return;
        }

        // Add floor plans to building object
        building.floorPlans = floorPlansResponse.data;

        // Fetch indoor data for room details
        const indoorDataResponse = await axios.get(`${baseURL}/api/indoordata/${building.tags.name}`);
        if (!indoorDataResponse.data) {
          showNotification('Indoor data not available', 'error');
          return;
        }

        // Find start and end rooms in indoor data
        const startRoom = indoorDataResponse.data.features.find(
          feature => feature.properties.id === parseInt(route.startLocation.lat)
        );
        const endRoom = indoorDataResponse.data.features.find(
          feature => feature.properties.id === parseInt(route.endLocation.lat)
        );

        if (!startRoom || !endRoom) {
          showNotification('Route endpoints not found', 'error');
          return;
        }

        // Create event with complete route data
        const event = new CustomEvent('openFloorPlan', {
          detail: {
            building,
            route: {
              ...route,
              startLocation: {
                ...route.startLocation,
                name: startRoom.properties.RoomName,
                floor: startRoom.properties.Floor
              },
              endLocation: {
                ...route.endLocation,
                name: endRoom.properties.RoomName,
                floor: endRoom.properties.Floor
              }
            },
            startLocationId: startRoom.properties.id,
            endLocationId: endRoom.properties.id
          }
        });

        // Dispatch event and close profile
        window.dispatchEvent(event);
        onClose();
      } catch (error) {
        console.error('Error loading indoor route:', error);
        showNotification('Error loading indoor route: ' + (error.response?.data?.message || error.message), 'error');
      }
    } else {
      // Handle outdoor routes
      onViewSavedRoute(route);
    }
  };

  const renderSavedRoutes = () => (
    <div className="saved-routes-list">
      {savedRoutes.length > 0 ? (
        savedRoutes.map((route) => (
          <div key={route._id} className="saved-route-item">
            <div className="route-info">
              <span>
                {route.startLocation?.name || 'Unknown'} to {route.endLocation?.name || 'Unknown'}
                {' '}({route.distance?.toFixed(2) || 'N/A'} {route.travelMode === 'indoor' ? 'meters' : 'miles'}, 
                {route.duration?.toFixed(0) || 'N/A'} min)
                {route.travelMode === 'indoor' && ' (Indoor)'}
              </span>
            </div>
            <div className="route-actions">
              <button onClick={() => handleViewRoute(route)}>
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
  );

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
       {renderSavedRoutes()}
      </div>

      {/* Add the Ban Panel */}
      {isElevated && (
        <div className="open-ban-panel">
          <div className="open-ban-panel-header">
            <h2>Ban Panel   </h2>
            <button
              className="open-ban-panel-button"
              onClick={handleOpenBanPanel}
            >
              OPEN BAN PANEL
            </button>
          </div>
        </div>
      )}

       {/* Add the Review Update Requests Frame */}
       {isElevated && (
        <div className="open-ban-panel">
          <div className="open-ban-panel-header">
            <h2>Review   </h2>
            <button
              className="open-review-requests-button"
              onClick={handleOpenReviewUpdateRequests}
            >
              REVIEW UPDATE REQUESTS
            </button>
          </div>
        </div>
      )}

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

      {/* Show Review Update Requests Overlay */}
      {showUpdateRequests && (
        <div className="update-requests-overlay">
          <div className="update-requests-content">
            <div className="update-requests-header">
              <h2>Review Update Requests</h2>
              <button className="close-update-requests-button" onClick={handleCloseReviewUpdateRequests}>×</button>
            </div>
            {updateRequests.length > 0 ? (
              <ul className="update-request-list">
                {updateRequests.map(request => (
                  <li key={request._id} className="update-request-item">
                    <p><strong>Building Name:</strong> {request.buildingName}</p>
                    <p><strong>Room ID:</strong> {request.roomId}</p>
                    <p><strong>New Room Name:</strong> {request.newRoomName}</p>
                    <p><strong>Submitted by:</strong> {request.username}</p>
                    <div className="update-request-actions">
                      <button className="approve-button" onClick={() => handleApproveRequest(request._id)}>APPROVE</button>
                      <button className="decline-button" onClick={() => handleDeclineRequest(request._id)}>DECLINE</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No update requests found.</p>
            )}
            
            {/* Floor Plan Requests */}
            <h3>Floor Plan Requests</h3>
            {floorPlanRequests.length > 0 ? (
              <ul className="floor-plan-request-list">
                {floorPlanRequests.map(request => (
                  <li key={request.requestId} className="floor-plan-request-item">
                    <p><strong>Building ID:</strong> {request.buildingID}</p>
                    <p><strong>Floor Number:</strong> {request.floorNumber}</p>
                    <p><strong>Image URL:</strong> <a href={request.imageURL} target="_blank" rel="noopener noreferrer">View Image</a></p>
                    <p><strong>Submitted by:</strong> {request.username}</p>
                    <div className="floor-plan-request-actions">
                      <button className="approve-button" onClick={() => handleApproveFloorPlanRequest(request)}>APPROVE</button>
                      <button className="decline-button" onClick={() => handleDeclineFloorPlanRequest(request)}>DECLINE</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No floor plan requests found.</p>
            )}
          </div>
        </div>
      )}

      {/* Ban Panel Overlay */}
      {showBanPanel && (
        <div className="ban-panel-overlay">
          <div className="ban-panel-content">
            <div className="ban-panel-header">
              <h2>Ban Panel</h2>
              <button className="close-ban-panel-button" onClick={handleCloseBanPanel}>×</button>
            </div>
            {banUnbanMessage && (
            <div className="ban-unban-message">
              {banUnbanMessage}
            </div>
            )}
            {allUsers.length > 0 ? (
              <ul className="user-list">
                {allUsers.map(u => (
                  <li key={u.id} className="user-item">
                    <span className="username">{u.username}</span>
                    <div className="user-actions">
                      <button
                        className="view-submissions-button"
                        onClick={() => handleViewSubmissions(u.username)}
                      >
                        View Submissions
                      </button>
                      {u.isBanned ? (
                        <button
                          className="unban-button"
                          onClick={() => handleUnbanUser(u.username)}
                        >
                          UNBAN
                        </button>
                      ) : (
                        <button
                          className="ban-button"
                          onClick={() => handleBanUser(u.username)}
                        >
                          BAN
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No users found.</p>
            )}
          </div>

          {showSubmissionsPopup && (
            <div className="submissions-popup-overlay">
              <div className="submissions-popup-content">
                <button className="close-submissions-popup-button" onClick={handleCloseSubmissionsPopup}>×</button>
                <h2>{selectedUsername}'s Suggestions</h2>
                {selectedUserSubmissions.length > 0 ? (
                  <ul className="submission-list">
                    {selectedUserSubmissions.map((submission, index) => (
                      <li key={index} className="submission-item">
                        <p><strong>Building ID:</strong> {submission.buildingID}</p>
                        <p><strong>Floor Number:</strong> {submission.floorNumber}</p>
                        <p><strong>Image URL:</strong> <a href={submission.imageURL} target="_blank" rel="noopener noreferrer">View Image</a></p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No submissions found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Profile;
