const bcrypt = require('bcryptjs');
const { sequelize } = require('../databaseConnection/db');
const { QueryTypes } = require('sequelize');
const { sendYoolaSMS } = require('./sendYoolaSMS');
const { sendEmail } = require('./sendEmail');

const createSignUpToken = async(user) => {
  try {

    const token = 100000 + Math.floor(Math.random()*900000);

    const salt = await bcrypt.genSalt(10)

    const hashedToken = await bcrypt.hash( token.toString(), salt)

    //get staff name, phone, id and email address by destructuring the object user

    const{id, staffName, phone, email} = user;

    const emailNotification = {
        to: email.trim(),
        subject: `Password setting token for MyTASO Application`.trim(),
        body: `Dear ${staffName}, 
        \nUse the token below to set/reset your MyTASO account password
        \nToken: ${token}
        \nUse it before it expires in the next 20 minutes.
        \nRegards,
        \nMyTASO\nThe Aids Support Organization,\nHealthy and empowered communities`.trim()
      }

      const phoneNotification = `Dear ${staffName}, your token is: ${token}. Use it before it expires in the next 20 minutes`

      //send notification via phone
      if(phone) {
      try {
        console.log('trying to send message to: ', phone)
        await sendYoolaSMS(phone, phoneNotification)
      } catch (error) {
        console.log('An error occurred while sending token on phone: ', error)
      }
    }

    //try sending email notification
    if(email) {
      try {
        await sendEmail(emailNotification.to, emailNotification.subject, emailNotification.body)
      } catch (error) {
        console.log('An error occured while sending token on user email', error)
      }
    }

    //Now post the hashed token into the db.
      await sequelize.query (
        ` UPDATE user 
          SET accountToken = :hashedToken,
          accountTokenCreatedAt = NOW() 
          WHERE id = :id`,
        {
          replacements: {id, hashedToken},
          type: QueryTypes.UPDATE
        }
      );
        
  } catch (error) {
      console.log('Error occured while generating token: ', error);
      return;
  }
}

module.exports = {
  createSignUpToken
}