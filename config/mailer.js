// config/mailer.js - sending emails
// Two ways:
// 1. SENDGRID_API_KEY is set (the live site on Render) -> SendGrid sends a real email.
//    Render's free plan blocks the SMTP ports (25, 465, 587), and SendGrid works over https.
// 2. no SendGrid key (my computer) -> Nodemailer with an Ethereal test inbox.
//    Ethereal is a fake SMTP server: nothing is really delivered, but every email gets a link to see it.
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

let transporter = null;

// make the Nodemailer transporter only once (on the first email) with a new Ethereal account
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

// send one email.
// returns the Ethereal link to see it, or null when SendGrid sent it to a real inbox
const sendMail = async (to, subject, html) => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to: to,
      from: { email: process.env.SENDGRID_FROM, name: "Book My Show" },
      subject: subject,
      html: html,
    });
    return null;
  }

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
