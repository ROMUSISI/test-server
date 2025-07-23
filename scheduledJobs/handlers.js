const { sendSmsBatches } = require("../reusables/sendSmsBatches")

const renewalReminderHandler = async() => {
  try {
    console.log('reminding members to renew')
    const memberArray = [/*
      {
        id: 1,
        name: 'Musisi Ronald',
        phone: '29064'
      },

      {
        id: 2,
        name: 'Paul Bongo',
        phone: '7429064'
      },

      {
        id: 3,
        name: 'Raul Catrol',
        phone: '064'
      }*/
    ]
    sendSmsBatches(memberArray, null, 'renewReminder')
  } catch (error) {
    console.log('An error occured while reminding members to renew: ', error)
  }
}

module.exports = {
  renewalReminderHandler
}