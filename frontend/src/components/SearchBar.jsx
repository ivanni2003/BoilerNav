import React from 'react'
import { useState, useEffect } from 'react'
import './SearchBar.css'

const baseURL = 'http://localhost:3001'

const SearchBar = ({items, updateMap, markRooms, viewSavedRoute, start, destination, searchStr}) => {
    
    const [search, setSearch] = useState('')
    const [hasStart, setHasStart] = useState(false) // whether start is not null
    const [hasDestination, setHasDestination] = useState(false) // whether destination is not null
    const [showDropdown, setShowDropdown] = useState(false)

    // might need to delete later
    useEffect(() => {
      if (start) {
          setSearch("Current Location")
          setShowDropdown(false)
          setHasStart(true)
      } 
      if (destination) {
          console.log(destination)
          if (destination.tags.name) {
            setSearch(destination.tags.name)
          }
          else {
            setSearch("Building")
          }
          setShowDropdown(false)
          setHasDestination(true)

      }
  }, [start, destination]);

    const handleChange = (e) => {
        setSearch(e.target.value)
        setShowDropdown(true);
    }

    const filteredItems = search 
  ? items.filter(item => {
      if (updateMap) {
        return item.tags && 
               item.tags.name && 
               item.tags.name.toLowerCase().includes(search.toLowerCase());
      } else if (viewSavedRoute) {
        return (`${item.startLocation.name} to ${item.endLocation.name}`).toLowerCase().includes(search.toLowerCase()) 
      }
      else {
        return item.properties.RoomName.toLowerCase().includes(search.toLowerCase()); 
      }
    }).slice(0, 20) 
  : [];

    const handleItemClick = async (item) => {

      if (updateMap) {   // click behavior for outer map
        updateMap(item.buildingPosition.lat, item.buildingPosition.lon, 20)

        setSearch(item.tags.name);
        setShowDropdown(false)
      }
      else if (viewSavedRoute) {
        viewSavedRoute(item)
      } 
      else {  //  click behavior for indoor map
        console.log("markRooms:", item)
        markRooms(item)
      }
    }
      return (
        <div>
          <input
            type="text"
            value={search}
            onChange={handleChange}
            placeholder={"Search For "  + searchStr}
            readOnly={hasDestination}
          />
          {showDropdown && !hasDestination &&   
            <div className="dropdown">            
                {filteredItems.length > 0 ?  (
                filteredItems.map((item, index) => (
                  <ul 
                    className="item" 
                    key={index} 
                    onClick={() => handleItemClick(item)} 
                    style={{ cursor: 'pointer' }}
                  >
                    {updateMap ? item.tags.name : 
                      viewSavedRoute 
                        ? `${item.startLocation.name} to ${item.endLocation.name}` 
                          : item.properties.RoomName} {/* based on usage of search bar */}
                  </ul>
                ))
              ) : !hasStart && search != "" && (
                <ul className="item">No results found</ul>
              )}
              
            </div>
          }
        </div>
      );

}

export default SearchBar