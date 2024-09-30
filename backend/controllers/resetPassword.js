const express = require('express');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const router = express.Router();  // Create a new router instance
const mailgun = new Mailgun(formData);

// Correct client initialization (no 'url' property needed)
const mg = mailgun.client({
  username: 'api',
  key: 'bd5bdec41a111454a3058b8395c38fc8-1b5736a5-66ebc6a2'  // replace with your actual API key
});

// Define a route for sending the email
router.post('/send', (req, res) => {
  mg.messages.create('sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org', {
    from: "Excited User <mailgun@sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org>",
    to: [req.body.email],  // Get recipient email from request body
    subject: "Password Reset",
    text: "You requested a password reset.",
    html: "<h1>Password Reset Instructions</h1>"
  })
  .then(msg => {
    console.log(msg);
    res.status(200).send("Email sent successfully!");
  })
  .catch(err => {
    console.log(err);
    res.status(500).send("Error sending email.");
  });
});

module.exports = router;  // Export the router
