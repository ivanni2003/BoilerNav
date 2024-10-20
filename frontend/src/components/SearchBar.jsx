import React from 'react'
import { useState, useEffect } from 'react'
import './SearchBar.css'

const baseURL = 'http://localhost:3001'

const SearchBar = ({items, updateMap, start, destination, searchStr}) => {
    
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
    ? items.filter(item => 
        item.tags && 
        item.tags.name && // Note: need to check this since there are microsoft building footprints marked as buildings w/no name for some reason
        item.tags.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20) 
    : [];

    const handleItemClick = async (item) => {
      updateMap(item.buildingPosition.lat, item.buildingPosition.lon, 20)

      setSearch(item.tags.name);
      setShowDropdown(false)
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
                filteredItems.map((item) => (
                <ul className="item" key={item.id} onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
                {item.tags.name}
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