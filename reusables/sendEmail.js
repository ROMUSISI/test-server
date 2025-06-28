const nodemailer = require ('nodemailer')
const dotenv = require ('dotenv')

dotenv.config();


const sendEmail = async (to, subject, body, cc = null, bcc = null) => {
  console.log('running function to send email');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER_ADDRESS,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_USER_ADDRESS}>`,
    to,
    subject,
    text: body
  };

  if (cc) {
    mailOptions.cc = cc; // Add Cc recipients
  }

  if (bcc) {
    mailOptions.bcc = bcc; // Add Bcc recipients
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { message: 'Email sent', info };
  } catch (error) {
    console.error('Error sending email:', error);
    return { message: 'Email failed', error };
  }
};

module.exports = {
  sendEmail
}


