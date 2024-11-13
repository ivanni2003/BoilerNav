const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router();
const User = require('../models/user');

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body;

  const user = await User.findOne({ username });

  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.password);

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    });
  }

  // Here we check if the user is banned. If banned, do not log him in.
  // If not banned, you can create the token.
  if (user.isBanned) {
    const token = "Banned"
    response
    .status(200)
    .send({ 
      id: user._id, // Include the user's ID
      token, 
      username: user.username, 
      name: user.fullName,
      email: user.email,
      major: user.major,
      affiliation: user.affiliation,
      isElevated: user.isElevated,
      isBanned: user.isBanned,
    });
  }
  else if (!user.isBanned) {
  const userForToken = {
    username: user.username,
    id: user._id,
  };

    // Token expires in 1 hour
    const token = jwt.sign(
      userForToken, 
      process.env.SECRET || 'your_fallback_secret_key',
      { expiresIn: 60*60 }
    );

    response
      .status(200)
      .send({ 
        id: user._id, // Include the user's ID
        token, 
        username: user.username, 
        name: user.fullName,
        email: user.email,
        major: user.major,
        affiliation: user.affiliation,
        isElevated: user.isElevated,
        isBanned: user.isBanned,
      });
    }
});

module.exports = loginRouter;