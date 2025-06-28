const { sendEmail } = require("./sendEmail");
const { sendYoolaSMS } = require("./sendYoolaSMS");

const notifyNewUser = async(userInfo, loginLink) => {

  const {userPhone, userEmailAddress, userName, staffName, unitId} = userInfo;

      const userEmailNotification = {
        to: userEmailAddress.trim(),
        subject: `MyTASO app User Account Opening`,
        body: `Dear ${staffName},
        \nAs you are aware, The Aids Support organzation is a membership organization with subscriber members and also runs a clients welfare scheme.
        \nMyTASO app is a modern web application/system designed;
        \n1. Enable TASO Members pay their subscription more easily wherever they are.
        \n2. Simplify registration and management of TASO Member data.
        \n3. Enable members of the TASO Clients welfare scheme to easily make their contributions.
        \n4. Simplify management of the clients welfare scheme.
        \n5. Ensure real time communication between TASO and her subscriber / Welfare scheme members.
        \nAs one of the key players, a user account has been opened for you and your details are as follows;
        \nUserName: ${userName}
        \nUnit: ${unitId}
        \nYour registered phone number for receiving tokens is: ${userPhone}
        \nClick on this link ${loginLink} to set a password and activate your account to login.
        \nFor support contact your M&E Officer, IT or head of unit
        \nRegards,
        \nMyTASO\nThe Aids Support Organization,\nHealthy and empowered communities`.trim()
      }

      const userPhoneNotification = `Your user account for MyTASO app/system has been created.
\nThe purpose of this system is to simplify TASO membership and welfare scheme management through improved REAL TIME COMMUNICATION. 
Your username is ${userName}. Click this link ${loginLink} to set a password and activate your account to login
For details contact your M&E officer, head of unit or IT team. Good luck!`

  try {
    
    if(userEmailAddress) {
      try {
        sendEmail(
          userEmailNotification.to,
          userEmailNotification.subject,
          userEmailNotification.body
        )
      } catch (error) {
       console.error('An error happened while sending a notification to a new user: ', error) 
      }
    }

    if(userPhone) {
      try {
        sendYoolaSMS(userPhone, userPhoneNotification)
      } catch (error) {
        console.error('An error ocurred while sending an sms to a new user: ', error)
      }
    }


  } catch (error) {
    console.log('An error occurred while sending notifications to a new user: ', error)
  }
};

module.exports = {
  notifyNewUser
}