const sendSmsBatches = async (recipientsArray = [], message = null, purpose = null) => {

  const {sendYoolaSMS} = require('./sendYoolaSMS')

  if(!recipientsArray || recipientsArray.length === 0 ) {
    return ({
      message: 'No recipiets provded'
    })
  }

  if(!message && !purpose) {
    return ({
      message: 'Message content or purpose is required for the message to be sent'
    })
  }
  // Proper delay function
  const delay = async (ms) => {
    console.log(`Waiting ${ms / 1000} seconds before next batch...`);
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  try {
    const batchSize = 50;
    const totalRecipients = recipientsArray.length;

    for (let i = 0; i < totalRecipients; i += batchSize) {
      const batch = recipientsArray.slice(i, i + batchSize);

      // Process the batch
      await Promise.all(
        batch.map(async (recipient) => {
          try {

            let messageBody = '';

            if(message) {
              messageBody = message
            };

            if(!message && purpose === 'renewReminder') {
              const currentYear = new Date().getFullYear()
              messageBody = `Dear ${recipient.name} (TASO Subscriber Member), You are reminded to renew your TASO Membership for the year ${currentYear}. Thank you.`
            }

            const to = recipient.phone;

            //send message.
            //await sendYoolaSMS(to, messageBody)

            console.log(`Sending to: ${recipient.name} (${recipient.phone})` + ', message: ' + message);
            // Place actual SMS sending logic here
            console.log(`Message sent to: ID=${recipient.id}, Name=${recipient.name}, Phone=${recipient.phone}`);
          } catch (error) {
            console.error(`Failed to send to ${recipient.id}, ${recipient.name}, ${recipient.phone}: ${error}`);
          }
        })
      );

      console.log(`Batch ${Math.floor(i / batchSize) + 1} sent`);

      // Delay between batches, unless it's the last batch
      if (i + batchSize < totalRecipients) {
        await delay(5000);
      }
    }

    // Final summary
    console.log(`All ${totalRecipients} messages were processed.`);

  } catch (error) {
    console.error('An error occurred while sending SMS batches:', error);
  }
};

module.exports = {
  sendSmsBatches
}