const indoorDataRouter = require('express').Router();
const IndoorData = require('../models/indoorData');

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

    console.log("patch")

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

module.exports = indoorDataRouter