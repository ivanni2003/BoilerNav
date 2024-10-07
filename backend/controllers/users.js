const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

usersRouter.post('/', async (request, response) => {
  const { fullName, major, affiliation, username, password, email } = request.body;

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

  try {
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



module.exports = usersRouter;