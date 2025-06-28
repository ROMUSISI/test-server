const { getPaymentInfo } = require("./getPaymentInfo");
const { getReceiptingStaffInfo } = require("./getReceiptingStaffInfo");
const { getStaffInfo } = require("./getStaffInfo");
const { sendEmail } = require("./sendEmail");
const { sendYoolaSMS } = require("./sendYoolaSMS");

const sendPaymentNotification = async(paymentId) => {

        //get payment info.
        const paymentInfo = await getPaymentInfo(paymentId)

        const {
          memberName, 
          phone1: memberPhone1, 
          phone2: memberPhone2, 
          emailAddress: memberEmailAddress, 
          uniqueMemberId,
          unitId, 
          amountPaid, 
          category,
          receivedByuserId
        } = paymentInfo;

        //Now get info about the receipting staff
        const receiptingStaffInfo = await getReceiptingStaffInfo(receivedByuserId);
        const {
          staffName: receiptingStaffName,
          phone: receiptingStaffPhone
        } = receiptingStaffInfo

        //Now retrieve unit admin info
        const unitAdminInfo = await getStaffInfo('unit admin/accountant', unitId);
        console.log('unit admin info for the new payment', unitAdminInfo);
        //destructure the above object
        const {
          staffName: unitAdminName,
          phone: unitAdminPhone,
          email: unitAdminEmailAddress
        } = unitAdminInfo;

  
        //Now get the unit head info
        const unitHeadInfo = await getStaffInfo('Head of unit', unitId);
        console.log('Unit head info for for the new payment', unitHeadInfo)
        //now destructure the above object
        const {
          staffName: unitHeadName,
          phone: unitHeadPhone,
          email: unitHeadEmailAddress
        } = unitHeadInfo;

        //Now send notifications to the member, unit head and unit admin
      const memberNotification = `
        Dear ${memberName} (${uniqueMemberId}), your UGX ${amountPaid} payment for ${category === 'Welfare' ? 'Welfare' : 'Membership'} has been received. You were served by ${receiptingStaffName} (Tel: ${receiptingStaffPhone}). Call ${unitAdminPhone} (Administrator) or ${unitHeadPhone} (Head of unit) for detatails. Thank you.
      `

      const unitEmailNotification = {
        to: unitAdminEmailAddress.trim(),
        subject: `New payment for TASO ${category === 'Welfare' ? 'Clients welfare scheme' : 'Membership subscription'} has been received.`.trim(),
        body: `Dear ${unitAdminName}, 
        \nThis is to notify you that a payment for TASO ${category === 'Welfare' ? 'Clients welfare scheme' : 'Membership subscription'} has been receieved by ${receiptingStaffName} at ${unitId}.
        \nMember name: ${memberName}, Member Id: ${uniqueMemberId}
        \nPhone number(s):${memberPhone1 && memberPhone1} ${memberPhone2 && ',' + memberPhone2}
        \nEmail address: ${memberEmailAddress || 'No email address provided'}
        \nAmountPaid: UGX ${amountPaid}
        \nRegards,
        \nMyTASO\nThe Aids Support Organization,\nHealthy and empowered communities`.trim()
        ,
        cc: unitHeadEmailAddress.trim()
      }

      
      //now try to send the sms to the member
      try {
        await sendYoolaSMS(memberPhone1.trim() || memberPhone2.trim(), memberNotification.trim())
      } catch (error) {
        console.error('Error sending payment notification sms to the memeber: ', error)
      }

      //Then try to send an sms to the unit head and admin
      try {
        await sendEmail(
          unitEmailNotification.to, 
          unitEmailNotification.subject, 
          unitEmailNotification.body, 
          unitEmailNotification.cc)
      } catch (error) {
        console.error('Error trying to send a payment notification emeail to the unit admin and head: ', error)
      }
}

module.exports = {
  sendPaymentNotification
}