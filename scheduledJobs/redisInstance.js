//import ioreds
const IORedis = require('ioredis');

//import dotenv
const dotenv = require('dotenv')

dotenv.config();

//create an instance of IORedis

const connection = new IORedis({
  host: process.env.VALKY_REDIS_HOST,
  port: process.env.VALKY_REDIS_PORT,
  username: process.env.VALKY_REDIS_USERNAME,     // from the credentials object
  password: process.env.VALKY_REDIS_PASSWORD,
  tls: {},
  maxRetriesPerRequest: null
});

module.exports = {
  connection
}