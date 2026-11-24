// config/mailer.js - sending emails with Nodemailer
// We use an Ethereal test inbox: a free fake SMTP server for testing.
// Emails are not really delivered, but every email gets a link where you can see it.
const nodemailer = require("nodemailer");

let transporter = null;

// make the transporter only once (on the first email) with a new Ethereal account
const getTransporter = async () => {
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("Ethereal test inbox ready:", testAccount.user);
  }
  return transporter;
};

// send one email, returns the link to see it in the Ethereal inbox
const sendMail = async (to, subject, html) => {
  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: '"Book My Show" <tickets@bookmyshow.test>',
    to: to,
    subject: subject,
    html: html,
  });
  return nodemailer.getTestMessageUrl(info);
};

module.exports = { sendMail };
