const indoorDataRouter = require('express').Router();
const IndoorData = require('../models/indoorData');

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

module.exports = indoorDataRouter