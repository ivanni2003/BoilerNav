const resetPasswordRouter = require('express').Router();
const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

resetPasswordRouter.post('/', async (request, response) => {
  const { email } = request.body;

  console.log('Email Address:', process.env.EMAIL_ADDRESS);
  console.log('Email Password:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');


  try {
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }

    // Generate a password reset token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send the password reset email
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_ADDRESS,
      subject: 'BoilerNav Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://localhost:3000/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);

    response.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error in password reset:', error);
    response.status(500).json({ error: 'An error occurred during the password reset process' });
  }
});

module.exports = resetPasswordRouter;