import React from 'react'
import { useState } from 'react'
import './SearchBar.css'

const SearchBar = ({items, updateMap, markRoom, viewSavedRoute, searchStr}) => {
    
    const [search, setSearch] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

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
        return item.room.properties.RoomName.toLowerCase().includes(search.toLowerCase()); 
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

        setSearch(`${item.startLocation.name} to ${item.endLocation.name}`)
        setShowDropdown(false)
      } 
      else {  //  click behavior for indoor map
        markRoom(item)

        setSearch(item.room.properties.RoomName)
        setShowDropdown(false)
      }
    }
      return (
        <div>
          <input
            type="text"
            value={search}
            onChange={handleChange}
            placeholder={"Search For "  + searchStr}
          />
          {showDropdown &&   
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
                          : item.room.properties.RoomName} {/* based on usage of search bar */}
                  </ul>
                ))
              ) : search != "" && (
                <ul className="item">No results found</ul>
              )}
              
            </div>
          }
        </div>
      );

}

export default SearchBar