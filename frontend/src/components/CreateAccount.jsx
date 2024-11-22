import React, { useState } from 'react';
import axios from 'axios';
import './CreateAccount.css';

const baseURL = process.env.VITE_APP_URL;

const CreateAccount = ({ onClose, onCreateSuccess, showNotification }) => {
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${baseURL}/api/users`, {
        fullName,
        major,
        affiliation,
        username,
        password,
        email
      });
      console.log('Account created:', response.data);
      onCreateSuccess(response.data);
      showNotification('Account created successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error creating account:', error);
      if (error.response) {
        if (error.response.status === 409) {
          // 409 Conflict - typically used for duplicate resource
          const field = error.response.data.field; // 'email' or 'username'
          showNotification(`An account with this ${field} already exists.`, 'error');
          setError(`An account with this ${field} already exists. Please use a different ${field}.`);
        } else {
          setError(error.response.data.error || 'An error occurred while creating the account.');
        }
      } else if (error.request) {
        setError('No response received from server. Please try again.');
      } else {
        setError('An error occurred while setting up the request. Please try again.');
      }
    }
  };

  return (
    <div className="create-account-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="major">Major:</label>
          <input
            type="text"
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="affiliation">Affiliation to Purdue University:</label>
          <select
            id="affiliation"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            required
          >
            <option value="">Select an option</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
            <option value="alumni">Alumni</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div> 
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default CreateAccount;