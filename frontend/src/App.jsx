import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'
import logoImage from './img/icon.png'
import CreateAccount from './components/CreateAccount'
import Login from './components/Login'
import Map from './components/Map'
import SearchBar from './components/SearchBar'

const baseURL = 'http://localhost:3001'

function App() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  const [buildings, setBuildings] = useState([])

  const [latitude, setLatitude] = useState(40.4274);
  const [longitude, setLongitude] = useState(-86.9132);
  const [zoom, setZoom] = useState(15)

  const fetchBuildings = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/ways/buildings`);
        setBuildings(response.data); 
      } catch (error) {
        console.log(error); 
      }
  };

  useEffect(() => {   // runs when component mounts
    console.log("fetch")
    if (!showLogin) { 
      fetchBuildings(); // Fetch buildings only when showLogin is false
    }
  }, []); // Dependency array includes showLogin

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleCreateAccount = () => {
    setShowCreateAccount(true);
    setIsPopupOpen(false);
  };

  const handleCloseCreateAccount = () => {
    setShowCreateAccount(false);
  };

  const handleLogin = () => {
    setShowLogin(true);
    setIsPopupOpen(false);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleTitleClick = () => {
    setShowCreateAccount(false);
    setShowLogin(false);
  };

  const handleMapUpdate = (latitude, longitude, zoom) => {
    setLatitude(latitude);
    setLongitude(longitude);
    setZoom(zoom)
  };


  return (
    <div className="app-container">
      <header className="app-header">
        <button className="user-button" onClick={togglePopup}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </button>
        {isPopupOpen && (
          <div className="popup">
            <button onClick={handleCreateAccount}>Create Account</button>
            <button onClick={handleLogin}>Log In</button>
          </div>
        )}
        <div className="logo-title" onClick={handleTitleClick} style={{cursor: 'pointer'}}>
          <img src={logoImage} alt="BoilerNav Logo" className="logo" />
          <h1>BoilerNav</h1>
        </div>
      </header>
      <div className="content">
        {(showCreateAccount ? (
            <CreateAccount onClose={handleCloseCreateAccount} />
          ) : showLogin ? (
            <Login onClose={handleCloseLogin} onLoginSuccess={handleLoginSuccess} />
          ) : (
            <div className="map-container">
            <Map latitude={latitude} longitude={longitude} zoom={zoom} />
            <div className="search-container">
                <SearchBar items={buildings} updateMap={handleMapUpdate}/>
            </div>
        </div>
  )
)}

      </div>
    </div>
  );
}

export default App
