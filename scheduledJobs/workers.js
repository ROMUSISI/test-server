const {Worker} = require('bullmq');
const { renewalReminderHandler } = require('./handlers');
const { renewalReminderJobName } = require('./queues');
const { connection } = require('./redisInstance');

const renewalReminderWorker = new Worker (
  renewalReminderJobName,
  renewalReminderHandler,
  {connection}
)
 
module.exports = {
  renewalReminderWorker
}