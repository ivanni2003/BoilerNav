const routesRouter = require("express").Router();
const Route = require("../models/route");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

routesRouter.post('/check-duplicate', authenticateToken, async (request, response) => {
  try {
    const { userId, startLocation, endLocation, travelMode, buildingId } = request.body;

    // Define tolerance for coordinate matching
    const COORDINATE_TOLERANCE = 0.0001;

    let query = {
      userId,
      travelMode
    };

    if (travelMode === 'indoor') {
      // For indoor routes, check exact match of building and floors
      query = {
        ...query,
        buildingId,
        'startLocation.floor': startLocation.floor,
        'endLocation.floor': endLocation.floor,
        'startLocation.lat': startLocation.lat,
        'endLocation.lat': endLocation.lat
      };
    } else {
      // For outdoor routes, use coordinate tolerance
      query = {
        ...query,
        'startLocation.lat': {
          $gte: startLocation.lat - COORDINATE_TOLERANCE,
          $lte: startLocation.lat + COORDINATE_TOLERANCE
        },
        'startLocation.lon': {
          $gte: startLocation.lon - COORDINATE_TOLERANCE,
          $lte: startLocation.lon + COORDINATE_TOLERANCE
        },
        'endLocation.lat': {
          $gte: endLocation.lat - COORDINATE_TOLERANCE,
          $lte: endLocation.lat + COORDINATE_TOLERANCE
        },
        'endLocation.lon': {
          $gte: endLocation.lon - COORDINATE_TOLERANCE,
          $lte: endLocation.lon + COORDINATE_TOLERANCE
        }
      };
    }

    const existingRoute = await Route.findOne(query);
    response.json({ isDuplicate: !!existingRoute, existingRoute });
  } catch (error) {
    console.error('Error checking for duplicate route:', error);
    response.status(500).json({ error: error.message });
  }
});

// Create new route
routesRouter.post('/', authenticateToken, async (request, response) => {
  try {
    const {
      userId,
      startLocation,
      endLocation,
      distance,
      duration,
      travelMode,
      polyline,
      isPublic,
      buildingId
    } = request.body;

    // Create route with all fields
    const route = new Route({
      userId,
      startLocation,
      endLocation,
      distance,
      duration,
      travelMode,
      polyline,
      isPublic,
      buildingId
    });

    const savedRoute = await route.save();
    response.status(201).json(savedRoute);
  } catch (error) {
    console.error('Error saving route:', error);
    response.status(400).json({ error: error.message });
  }
});
// Get all public routes
routesRouter.get("/public", async (request, response) => {
  try {
    const routes = await Route.find({ isPublic: true });
    response.json(routes);
  } catch (error) {
    console.error("Error fetching public routes:", error);
    response.status(400).json({ error: error.message });
  }
});

// Get user's routes (both public and private)
routesRouter.get("/:userId", authenticateToken, async (request, response) => {
  try {
    // Check if the requesting user is the owner of the routes
    if (request.user.id !== request.params.userId) {
      // If not the owner, only return public routes
      const routes = await Route.find({
        userId: request.params.userId,
        isPublic: true,
      });
      response.json(routes);
    } else {
      // If owner, return all routes (public and private)
      const routes = await Route.find({ userId: request.params.userId });
      response.json(routes);
    }
  } catch (error) {
    console.error("Error fetching routes:", error);
    response.status(400).json({ error: error.message });
  }
});

// Update route privacy
routesRouter.patch(
  "/:routeId/privacy",
  authenticateToken,
  async (request, response) => {
    try {
      const { isPublic } = request.body;
      const routeId = request.params.routeId;

      const route = await Route.findById(routeId);

      if (!route) {
        return response.status(404).json({ error: "Route not found" });
      }

      // Ensure the user owns this route
      if (route.userId.toString() !== request.user.id) {
        return response
          .status(403)
          .json({ error: "Not authorized to modify this route" });
      }

      route.isPublic = isPublic;
      const updatedRoute = await route.save();

      response.json(updatedRoute);
    } catch (error) {
      console.error("Error updating route privacy:", error);
      response
        .status(500)
        .json({ error: "An error occurred while updating route privacy" });
    }
  },
);

// Update route duration
routesRouter.patch(
  "/:routeId/duration",
  authenticateToken,
  async (request, response) => {
    try {
      const { duration } = request.body;
      const routeId = request.params.routeId;

      const route = await Route.findById(routeId);

      if (!route) {
        return response.status(404).json({ error: "Route not found" });
      }

      // Ensure the user owns this route
      if (route.userId.toString() !== request.user.id) {
        return response
          .status(403)
          .json({ error: "Not authorized to modify this route" });
      }

      route.duration = duration;
      const updatedRoute = await route.save();

      response.json(updatedRoute);
    } catch (error) {
      console.error("Error updating route duration:", error);
      response
        .status(500)
        .json({ error: "An error occurred while updating route duration" });
    }
  },
);

// Delete route
routesRouter.delete(
  "/:routeId",
  authenticateToken,
  async (request, response) => {
    try {
      const routeId = request.params.routeId;
      const route = await Route.findById(routeId);

      if (!route) {
        return response.status(404).json({ error: "Route not found" });
      }

      // Check if the authenticated user owns this route
      if (route.userId.toString() !== request.user.id) {
        return response
          .status(403)
          .json({ error: "Not authorized to delete this route" });
      }

      await Route.findByIdAndDelete(routeId);

      // Remove the route reference from the user's savedRoutes array
      await User.findByIdAndUpdate(request.user.id, {
        $pull: { savedRoutes: routeId },
      });

      response.status(204).end();
    } catch (error) {
      console.error("Error deleting route:", error);
      response
        .status(500)
        .json({ error: "An error occurred while deleting the route" });
    }
  },
);

module.exports = routesRouter;
