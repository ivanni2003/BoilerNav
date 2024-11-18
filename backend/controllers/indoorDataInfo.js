const indoorDataRouter = require('express').Router();
const IndoorData = require('../models/indoorData');
const UpdateRequest = require('../models/updateRequest');

// POST endpoint to approve an update request
indoorDataRouter.post('/approve-update-request/:id', async (request, response) => {
  const id = request.params.id;
  try {
    const updateRequest = await UpdateRequest.findById(id);
    if (!updateRequest) {
      console.log("not found")
      return response.status(404).json({ error: 'Update request not found' });
    }

    const { buildingName, roomId, newRoomName } = updateRequest;

    // Find the indoor data for the building
    const indoorData = await IndoorData.findOne({ name: buildingName.replace(/\s+/g, '') });
    if (!indoorData) {
      console.log("not found for buildign")
      return response.status(404).json({ error: 'Indoor data not found for building' });
    }

    // Find the feature with the given roomId
    const featureIndex = indoorData.features.findIndex(
      feature => feature.properties.id === roomId
    );

    if (featureIndex === -1) {
      console.log("room not found")
      return response.status(404).json({ error: 'Room not found in indoor data' });
    }

    // Update the room name
    indoorData.features[featureIndex].properties.RoomName = newRoomName;

    // Save the updated indoor data
    await indoorData.save();

    // Delete the update request
    await UpdateRequest.findByIdAndDelete(id);

    response.status(200).json({ message: 'Update request approved and indoor data updated' });
  } catch (error) {
    console.error('Error approving update request:', error);
    response.status(500).json({ error: 'Failed to approve update request' });
  }
});

indoorDataRouter.post('/', async(request, response) => {   // post entire building data object
    const indoorData = request.body

    const indoorDataObj = new IndoorData(indoorData)

    try {
        await indoorDataObj.save()
        response.json(indoorDataObj)
    } catch (error) {
        response.json(400, error)
    }
})

// GET endpoint to get ALL update requests.
indoorDataRouter.get('/get-update-requests', async (request, response) => {
  try {
    const updateRequests = await UpdateRequest.find({})
        if (!updateRequests) {
            return response.status(404).send('indoor data not found')
        }
        response.json(updateRequests)
  } catch (error) {
    console.error('Error handling update request:', error);
    response.status(500).json({ error: 'Failed to submit update request' });
  }
});

indoorDataRouter.get('/:name', async(request, response) => {  // get building data by name
    const name = request.params.name.replace(' ', '')

    try {
        const indoorData = await IndoorData.findOne({ name })
        if (!indoorData) {
            return response.status(404).send('indoor data not found')
        }
        response.json(indoorData)
    } catch (error) {
        response.status(400, error)
    }
})

indoorDataRouter.patch('/:name/:id', async(request, response) => {
    const name = request.params.name.replace(' ', '')
    const id = parseInt(request.params.id)


    try {
        const indoorData = await IndoorData.findOne({ name })

        if (id < 0) {
            return response.status(404).send('Feature with requested id does not exist');
        }
        
        indoorData.features[id - 1].properties.DestinationCount += 1;   // assumes ids are aligned with order of objects

        await indoorData.save();
        response.status(200).json(indoorData.features[id - 1]);

    } catch (error) {
        response.status(400, error)
    }
})

indoorDataRouter.get('/:name/:floor/topRooms', async (request, response) => { // get top rooms on requested floor of building
    const name = request.params.name.replace(' ', '')
    const floorNum = request.params.floor


    try {
        const indoorData = await IndoorData.findOne({ name })
        if (!indoorData) {
            return response.status(404).send('indoor data not found')
        }
        const floorRooms = indoorData.features.filter(item => item.properties.Floor == floorNum && item.properties.Type == 'Room')
        const sortedRooms = floorRooms.sort((itemA, itemB) => itemB.properties.DestinationCount - itemA.properties.DestinationCount)

        const topRooms = []
        for (i = 0; i < 3; i++) {  // add top 3 rooms
            if (sortedRooms[i].properties.DestinationCount > 0) {
                topRooms.push(sortedRooms[i])
            }
        }   
        response.json(topRooms)

    } catch (error) {
        response.json(400, error)
    }

})

// Add endpoint to submit update requests
indoorDataRouter.post('/update-request', async (request, response) => {
    const { buildingName, roomId, newRoomName, username } = request.body;
    try {
      const updateRequest = new UpdateRequest({
        buildingName,
        roomId,
        newRoomName,
        username
      });
      await updateRequest.save();
  
      response.status(200).json({ message: 'Update request submitted successfully' });
    } catch (error) {
      console.error('Error handling update request:', error);
      response.status(500).json({ error: 'Failed to submit update request' });
    }
  });

// DELETE endpoint to decline (delete) an update request
indoorDataRouter.delete('/update-request/:id', async (request, response) => {
  const id = request.params.id;
  try {
    const deletedRequest = await UpdateRequest.findByIdAndDelete(id);
    if (!deletedRequest) {
      return response.status(404).json({ error: 'Update request not found' });
    }
    response.status(200).json({ message: 'Update request declined and deleted successfully' });
  } catch (error) {
    console.error('Error declining update request:', error);
    response.status(500).json({ error: 'Failed to decline update request' });
  }
});

// GET endpoint to DECLINE or APPROVE an update request.


module.exports = indoorDataRouter