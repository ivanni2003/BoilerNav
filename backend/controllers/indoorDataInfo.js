const indoorDataRouter = require('express').Router();
const IndoorData = require('../models/indoorData');
const UpdateRequest = require('../models/updateRequest');

indoorDataRouter.post('/', async(request, response) => {
    const indoorData = request.body

    const indoorDataObj = new IndoorData(indoorData)

    try {
        await indoorDataObj.save()
        response.json(indoorDataObj)
    } catch (error) {
        response.json(400, error)
    }
})

indoorDataRouter.get('/:name', async(request, response) => {  // get by name
    const name = request.params.name;

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

// GET endpoint to DECLINE or APPROVE an update request.


module.exports = indoorDataRouter