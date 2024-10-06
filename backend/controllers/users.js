const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');

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

module.exports = usersRouter;