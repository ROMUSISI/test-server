const { renewalReminderQueue, renewalReminderJobName } = require("./queues")

const addRenewalReminderJobs = async() => {
  try {
    await renewalReminderQueue.add(
      renewalReminderJobName,
      {},
      {
        repeat: {
          cron: '*/3 * * * *'
        }
      }
     )
  } catch (error) {
    
  }
};

module.exports = {
  addRenewalReminderJobs
}