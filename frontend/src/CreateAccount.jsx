import React, { useState } from 'react';
import axios from 'axios';
import './CreateAccount.css';

const CreateAccount = ({ onClose }) => {
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/users', {
        fullName,
        major,
        affiliation,
        username,
        password
      });
      console.log('Account created:', response.data);
      onClose();
    } catch (error) {
      console.error('Error creating account:', error);
      // Handle error (e.g., show error message to user)
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
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default CreateAccount;