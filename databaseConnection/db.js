const Sequelize = require ('sequelize');
const dotenv = require ('dotenv');
const fs = require('fs'); //import fs to read the ca certificate
const path = require('path');

dotenv.config();

// Resolve path to the cert file in the same directory
const caCertPath = path.join(__dirname, 'ca-certificate.crt');

// Sequelize configuration
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    dialectOptions: process.env.NODE_ENV !== 'development' && {
      ssl: {
        ca: fs.readFileSync(caCertPath)
      }
    }
  }
);

// function for testing connection
const testDb = async () => {
  try {
    await sequelize.authenticate();
    console.log ('successifully connected to database');
  } catch (error) {
    console.error ('not able to connect to database');
    console.error ('Error:', error);
  }
}



//function for syncing to db
const syncDb = async () => {
  try {
    await sequelize.sync ({force: false})
    console.log ('successifully synced database')
    await testDb (); 
  } catch (error) {
    console.error ('Error connecting to db', error)
  }
}

module.exports = {
  sequelize, 
  syncDb
};
