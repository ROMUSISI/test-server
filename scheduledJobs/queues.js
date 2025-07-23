const {Queue} = require('bullmq');
const { connection } = require('./redisInstance');

const renewalReminderJobName = 'renewalReminderQueue'

const renewalReminderQueue = new Queue(renewalReminderJobName, {connection});


module.exports = {
  renewalReminderQueue,
  renewalReminderJobName
}