const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

usersRouter.post('/', async (request, response) => {
  try {
    const { fullName, major, affiliation, username, password, email } = request.body;

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return response.status(409).json({ error: 'Username already exists', field: 'username' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return response.status(409).json({ error: 'Email already exists', field: 'email' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      fullName,
      major,
      affiliation,
      username,
      password: passwordHash,
      email,
    });

    const savedUser = await user.save();
    response.status(201).json(savedUser);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

usersRouter.put('/:id', async (request, response) => {
  const { id } = request.params;
  const { name, email, major, affiliation } = request.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fullName: name, email, major, affiliation },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return response.status(404).json({ error: 'User not found' });
    }

    response.json(updatedUser);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

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

usersRouter.delete('/:id', authenticateToken, async (request, response) => {
  try {
    const { id } = request.params;
    
    // Ensure the authenticated user is deleting their own account
    if (id !== request.user.id) {
      return response.status(403).json({ error: 'You can only delete your own account' });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return response.status(404).json({ error: 'User not found' });
    }
    
    response.status(204).end();
  } catch (error) {
    console.error('Error in delete user route:', error);
    response.status(500).json({ error: error.message });
  }
});

usersRouter.post('/:id/favorites', async (request, response) => {
  try {
    const { id } = request.params;
    const { name, lat, lon, buildingId } = request.body;

    const user = await User.findById(id);
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }

    user.favoriteLocations.push({ name, lat, lon, buildingId });
    await user.save();

    response.status(201).json(user.favoriteLocations);
  } catch (error) {
    console.error('Error saving favorite location:', error);
    response.status(500).json({ error: 'An error occurred while saving the favorite location' });
  }
});

usersRouter.get('/:id/favorites', async (request, response) => {
  try {
    const { id } = request.params;

    const user = await User.findById(id);
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }

    response.json(user.favoriteLocations);
  } catch (error) {
    console.error('Error fetching favorite locations:', error);
    response.status(500).json({ error: 'An error occurred while fetching favorite locations' });
  }
});

usersRouter.get('/me', authenticateToken, async (request, response) => {
  try {
    const user = await User.findById(request.user.id);
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }
    response.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    response.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

usersRouter.delete('/:id/favorites/:buildingId', async (request, response) => {
  try {
    const { id, buildingId } = request.params;

    const user = await User.findById(id);
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }

    user.favoriteLocations = user.favoriteLocations.filter(
      location => location.buildingId !== buildingId
    );
    await user.save();

    response.status(200).json(user.favoriteLocations);
  } catch (error) {
    console.error('Error removing favorite location:', error);
    response.status(500).json({ error: 'An error occurred while removing the favorite location' });
  }
});

module.exports = usersRouter;