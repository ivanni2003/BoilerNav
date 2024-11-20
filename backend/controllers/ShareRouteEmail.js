const express = require('express');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const ShareRouterouter = express.Router();  // Create a new router instance
const mailgun = new Mailgun(formData);
const crypto = require('crypto');
const Token = require('../models/token');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const mg = mailgun.client({
    username: 'api',
    key: 'bd5bdec41a111454a3058b8395c38fc8-1b5736a5-66ebc6a2'  // replace with your actual API key
  });

  ShareRouterouter.post('/', async (req, res) => {
    const { email, resetLink } = req.body;

    if (!email || !resetLink) {
        return res.status(400).json({ message: "Email and reset link are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    try {
        const msg = await mg.messages.create('sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org', {
            from: "Excited User <mailgun@sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org>",
            to: [email],
            subject: "Route to Building",
            text: "You wanted a Route to a Building.",
            html: `<h1>Route to Building</h1><br>
                   <body>
                     <p>Click to go to that Building:</p>
                     <a href="${resetLink}">Link</a>
                   </body>`
          });
          return res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
      console.error(error);          
      return res.status(500).json({ message: "Error saving token or sending email." });
    }

  });

  module.exports = ShareRouterouter;