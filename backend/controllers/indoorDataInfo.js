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
    const name = request.params.name;

    try {
        const indoorData = await IndoorData.find({ name })
        if (!indoorData) {
            return response.status(404).send('indoor data not found')
        }
        response.json(indoorData)
    } catch (error) {
        response.status(400, error)
    }
})

indoorDataRouter.patch('/:name/:id', async(request, response) => {
    const name = request.params.name
    const id = parseInt(request.params.id)

    try {
        const indoorData = await IndoorData.find({ name })
        if (!indoorData) {
            return response.status(404).send('indoor data not found')
        }

        if (featureIndex === -1) {
            return response.status(404).send('Feature with requested id does not exist');
        }
        
        indoorData.features[id - 1].properties.DestinationCount += 1;   // assumes ids are aligned with order of objects

        await indoorData.save();

        response.status(200).json(indoorData.features[featureIndex]);

    } catch (error) {
        response.status(400, error)
    }
})

module.exports = indoorDataRouter