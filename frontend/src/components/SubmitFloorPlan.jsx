import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SubmitFloorPlan.css';

const baseURL = "http://localhost:3001";

const PopupForm = ({isVisible, onClose, user, building, showNotification}) => {
    const [imageURL, setImageURL] = useState('')
    const [floorNumber, setFloorNumber] = useState('')
    if (!isVisible) {
        return null
    }
  
    const handleImageURLChange = (e) => {
      setImageURL(e.target.value);
      console.log(imageURL)
    }
  
    const handleFloorNumberChange = (e) => {
      setFloorNumber(e.target.value);
    }
  
    const handleSubmit = async (e) => {
      e.preventDefault()
  
      try {
        const response = await axios.post(`${baseURL}/api/users/floorPlanRequests`, {
          username: user.username,
          imageURL: imageURL,
          buildingID: building.id,
          floorNumber: floorNumber
        })
  
        showNotification('Request submitted successfully', 'success')
      }
      catch (error) {
        console.log(error)
      }
    }
  
    return (
        <div>
            <div>
            <span className="close" onClick={onClose}>&times;</span>
                <h2 style={{ fontSize: '18px'}}>Submit Floor Plan</h2>
                <form className="popup-form" onSubmit={handleSubmit}>
                  <div>
                    <label>
                      Floor Plan URL:
                      <input type="text" placeholder="enter image url" onChange={handleImageURLChange} value={imageURL}/>
                    </label>
                  </div>
                  <div>
                  <label>
                      Floor Number:
                      <input type="text" 
                            value={floorNumber}
                            placeholder="-1: basement, 0: ground, 1: floor 1, ..." 
                            onChange={handleFloorNumberChange}/>
                    </label>
                  </div>
                  <div>
                    <button type="submit">Submit</button>
                  </div>
                </form>
            </div>
        </div>
    )
  }

const SubmitFloorPlan = ({user, building, showNotification}) => {
    const [isPopupFormVisible, setIsPopupFormVisible] = useState(false)

    const closePopupForm = () => {
        setIsPopupFormVisible(false)
      }
    
      const handleOpenPopupForm = () => {
        if (user) {
          setIsPopupFormVisible(true)
        }
        else {
          console.log("notification")
          showNotification('Please login to your account.', 'info');
        }
      }

      return (
        <div className='submit-floor-plan'>
            {!isPopupFormVisible && 
             <button className="submit-floor-plan-btn" onClick={() => handleOpenPopupForm()}>Submit Floor Plan Image</button>
            }
        <PopupForm isVisible={isPopupFormVisible} onClose={closePopupForm} user={user} building={building} showNotification={showNotification}/>
        </div>
      )
}

 export default SubmitFloorPlan