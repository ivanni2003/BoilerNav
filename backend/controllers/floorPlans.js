const floorPlanRouter = require('express').Router();
const FloorPlan = require('../models/floorPlan');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
}).single('image'); // 'image' should match the key in your form-data

// POST endpoint to upload a floor plan
floorPlanRouter.post('/', async (request, response) => {
  const { buildingId, floorNumber, imageUrl } = request.body;

  if (!buildingId || !floorNumber || !imageUrl) {
    return response.status(400).json({ error: 'BuildingId, floorNumber, and imageUrl are required.' });
  }

  const floorPlan = new FloorPlan({
    buildingId: buildingId,
    floorNumber: floorNumber,
    imageUrl: imageUrl
  });

  try {
    const savedFloorPlan = await floorPlan.save();
    response.status(201).json(savedFloorPlan);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

// GET endpoint to retrieve floor plans for a specific building
floorPlanRouter.get('/building/:buildingId', async (request, response) => {
  const buildingId = Number(request.params.buildingId);
  
  try {
    const floorPlans = await FloorPlan.find({ buildingId });
    response.json(floorPlans);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

module.exports = floorPlanRouter;