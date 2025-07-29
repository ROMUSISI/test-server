const { tryCatch } = require("bullmq");
const { sendYoolaSMS } = require("./sendYoolaSMS");
const { checkSmsCredit } = require("./smsHelpers/checkSmsCredit");
const { queueMessage } = require("./smsHelpers/queueMessage");
const { storeSentMessage } = require("./smsHelpers/storeSentMessage");
const { deductCredit } = require("./smsHelpers/deductCredit");

const sendSms = async(phone = null, message = null, unitId = null) => {

  try {

    //Check whether there is sms credit
    const credit = await checkSmsCredit();

    //send the message if there is credit and Log the message in the message log table
    if(credit){

      try { 
        //This section will change in the future when yoola sorts its error handling 
        //In that case, if an error occuurs while sending a message, the message shall never be saved.
        //For now the saving of the message will help in tracking sms credit balance.
        await sendYoolaSMS(phone, message)
      } catch (error) {
        console.log('An error happened while trying to send a message: ', error)
      }
      //store message
      const insertId = await storeSentMessage(message, phone, unitId)
      
      //Then deduct credit
      await deductCredit(insertId)
    }

    //Else queue the message so it will send when there is credit
    if(!credit) {
      await queueMessage();
    }

  } catch (error) {
    console.log('An error occurred while trying to send a message: ', error)
  }
};

module.exports = {
  sendSms
};