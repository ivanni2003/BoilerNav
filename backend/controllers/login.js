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
      token, 
      username: user.username, 
      name: user.fullName,
      email: user.email,
      major: user.major,
      affiliation: user.affiliation
    });
});

module.exports = loginRouter;