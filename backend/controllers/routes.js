const routesRouter = require('express').Router();
const Route = require('../models/route');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

routesRouter.post('/', authenticateToken, async (request, response) => {
  try {
    const { 
      userId, 
      startLocation, 
      endLocation, 
      distance, 
      duration, 
      travelMode, 
      polyline 
    } = request.body;

    // Ensure polyline is an array of {lat, lon} objects
    const processedPolyline = polyline.map(point => ({
      lat: point.lat || point[0],
      lon: point.lon || point[1]
    }));

    const route = new Route({
      userId,
      startLocation,
      endLocation,
      distance,
      duration,
      travelMode,
      polyline: processedPolyline
    });

    const savedRoute = await route.save();
    response.status(201).json(savedRoute);
  } catch (error) {
    console.error('Error saving route:', error);
    response.status(400).json({ error: error.message });
  }
});

routesRouter.get('/:userId', authenticateToken, async (request, response) => {
  try {
    const routes = await Route.find({ userId: request.params.userId });
    response.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    response.status(400).json({ error: error.message });
  }
});

routesRouter.delete('/:routeId', authenticateToken, async (request, response) => {
  try {
    const routeId = request.params.routeId;
    const route = await Route.findById(routeId);

    if (!route) {
      return response.status(404).json({ error: 'Route not found' });
    }

    // Check if the authenticated user owns this route
    if (route.userId.toString() !== request.user.id) {
      return response.status(403).json({ error: 'Not authorized to delete this route' });
    }

    await Route.findByIdAndDelete(routeId);

    // Remove the route reference from the user's savedRoutes array
    await User.findByIdAndUpdate(
      request.user.id,
      { $pull: { savedRoutes: routeId } }
    );

    response.status(204).end();
  } catch (error) {
    console.error('Error deleting route:', error);
    response.status(500).json({ error: 'An error occurred while deleting the route' });
  }
});


module.exports = routesRouter;