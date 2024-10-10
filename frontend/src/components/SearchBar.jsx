import React from 'react'
import { useState, useEffect } from 'react'
import './SearchBar.css'
import axios from 'axios'

const baseURL = 'http://localhost:3001'

const SearchBar = ({items, updateMap, start, destination}) => {
    
    const [search, setSearch] = useState('')
    const [hasDestination, setHasDestination] = useState(false) // whether destination is not null

    // Note: start and dest will only be non-null if search component is used as part of directions menu
    useEffect(() => {
      if (start) {
          setSearch("Current Location")
          setHasDestination(true)
      } 
      if (destination) {
          console.log(destination)
          if (destination.tags.name) {
            setSearch(destination.tags.name)
          }
          else {
            setSearch("Building")
          }
          setHasDestination(true)

      }
  }, [start, destination]);

    const handleChange = (e) => {
        setSearch(e.target.value)
    }

    const filteredItems = search 
    ? items.filter(item => 
        item.tags && 
        item.tags.name && // Note: need to check this since there are microsoft building footprints marked as buildings w/no name for some reason
        item.tags.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20) 
    : [];

    const handleItemClick = async (item) => {
      let totalLat = 0
      let totalLon = 0
      let numNodes = 0
 
      try {
        let idList = ""
        for (const nodeId of item.nodes) {
            idList += nodeId + ',' 
        }
        idList = idList.slice(0, -1)  // remove last ','
        const response = await axios.get(`${baseURL}/api/nodes/id/${idList}`)  // fetch all nodes associate w/building
        const nodes = response.data
        
        for (const node of nodes) {
          totalLat += node.lat
          totalLon += node.lon
          numNodes += 1
        }
        
      } catch (error) {
        console.log(error);
      }
      const avgLat = totalLat / numNodes
      const avgLon = totalLon / numNodes

      updateMap(avgLat, avgLon, 20)

      setSearch(item.tags.name);
    }
      return (
        <div>
          <input
            type="text"
            value={search}
            onChange={handleChange}
            placeholder="Search For Destination"
            readOnly={hasDestination}
          />
          {!hasDestination &&  
            <div className="dropdown">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                <ul className="item" key={item.id} onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
                {item.tags.name}
              </ul>
                ))
              ) : (
                <ul className="item">No results found</ul>
              )}
            </div>
          }
        </div>
      );

}

export default SearchBar