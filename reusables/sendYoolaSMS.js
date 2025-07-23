const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

async function sendYoolaSMS(phone, message) {

  if (!phone || !message) {
    throw new Error('phone, message, and apiKey are required');
  }

  const payload = {
    phone,
    message,
    api_key: process.env.YOOLA_API_KEY
  };

  try {
    const response = await axios.post('https://yoolasms.com/api/v1/send', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(response.data)

    return response.data;

  } catch (error) {
    // You can customize this error handling as needed
    console.log('Error sending sms: ', error)
    return;
  }
}

module.exports = {
  sendYoolaSMS
};