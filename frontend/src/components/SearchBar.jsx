import React, { useState } from 'react';
import './SearchBar.css'
import axios from 'axios'

const baseURL = 'http://localhost:3001'

const SearchBar = ({items, updateMap}) => {
    
    const [search, setSearch] = useState('')

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
        for (const nodeId of item.nodes) {
            const response = await axios.get(`${baseURL}/api/nodes/id/${nodeId}`)
            const node = response.data
            totalLat += node[0].lat
            totalLon += node[0].lon
            numNodes += 1
        }
      } catch (error) {
        console.log(error);
      }
      const avgLat = totalLat / numNodes
      const avgLon = totalLon / numNodes

      updateMap(avgLat, avgLon, 20)
    }
      return (
        <div>
          <input
            type="text"
            value={search}
            onChange={handleChange}
            placeholder="Search For Destination"
          />
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
        </div>
      );

}

export default SearchBar