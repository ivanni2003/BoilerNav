const express = require('express');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const router = express.Router();  // Create a new router instance
const mailgun = new Mailgun(formData);
const crypto = require('crypto');
const Token = require('../models/token');

// Correct client initialization (no 'url' property needed)
const mg = mailgun.client({
  username: 'api',
  key: 'bd5bdec41a111454a3058b8395c38fc8-1b5736a5-66ebc6a2'  // replace with your actual API key
});



// Define a route for sending the email
// In ResetPassword.js
router.post('/', async (req, res) => {
  const { email } = req.body;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const token = array[0];
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;
  const expirationTime = Date.now() + 3600000;
  const tokenDoc = new Token({
    email,
    token,
    expiresAt: expirationTime
  });
  const d = new Date();
  const hour = ((d.getHours() + 1) % 24).toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  try {
    // Save the token in the database
    await tokenDoc.save();

    // Send the email if token saved successfully
    const msg = await mg.messages.create('sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org', {
      from: "Excited User <mailgun@sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org>",
      to: [email],
      subject: "Password Reset",
      text: "You requested a password reset.",
      html: `<h1>Password Reset Instructions</h1><br>
             <body>
               <p>Click to reset your password:</p>
               <a href="${resetLink}">Link</a>
               <p>This link expires in 1 hour at ${new Date(expirationTime).toLocaleTimeString()}</p>
             </body>`
    });

    console.log(msg);
    return res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error saving token or sending email." });
  }
});

router.post('/:token', (req, res) => {
  const { token } = request.params;
  const { newPassword } = req.body;
  //check if token and or password are bad
  //create database or something for tokens and add to above.
  //maybe need user id for changing the password

  

  //check token against database of some kind?
  //if bad then send bad token thing
  //if good then change password
  //if worked then send OK
  //if not worked then send Not OK
})


module.exports = router;  // Export the router
