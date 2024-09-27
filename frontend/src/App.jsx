import { useState } from 'react'
import './App.css'
import axios from 'axios'
import logoImage from '../public/icon.png'

const baseURL = 'http://localhost:3001'

/*
How to run:
1) ensure you are in frontend directory
2) npm install vite
3) type npm run dev in terminal
4) open localhost 5173

*/
function App() {
  const [testData, setTestData] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const getData = async () => {
    try {
      const response = await axios.get(baseURL + '/api/test');
      setTestData(response.data);
    } catch (exception) {
      console.log(exception)
    }
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
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
            <button onClick={() => console.log("Create Account clicked")}>Create Account</button>
            <button onClick={() => console.log("Log In clicked")}>Log In</button>
          </div>
        )}
        <div className="logo-title">
          <img src={logoImage} alt="BoilerNav Logo" className="logo" />
          <h1>BoilerNav</h1>
        </div>
      </header>
      <div className="content">
        <button onClick={getData}>Show test data</button>
        
        {(
          <ul>
            {testData.map(user => (
              <li key={user.id}>ID: {user.id}, Name: {user.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App
