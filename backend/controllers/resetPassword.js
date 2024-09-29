const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

// Correct client initialization (no 'url' property needed)
const mg = mailgun.client({
  username: 'api',
  key: 'bd5bdec41a111454a3058b8395c38fc8-1b5736a5-66ebc6a2'  // replace with your actual API key
});

// Send email
mg.messages.create('sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org', {
  from: "Excited User <mailgun@sandbox19bae2ebb0364a398da14766ce80414c.mailgun.org>",
  to: ["hunter.b.striegel@gmail.com"],
  subject: "Hello",
  text: "Testing some Mailgun awesomeness!",
  html: "<h1>Testing some Mailgun awesomeness!</h1>"
})
.then(msg => console.log(msg)) // logs response data
.catch(err => console.log(err)); // logs any error
