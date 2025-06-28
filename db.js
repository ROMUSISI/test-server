const express = require('express');
const fs = require('fs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      ssl: {
        ca: fs.readFileSync('./certs/ca-certificate.crt')
      }
    },
    logging: false,
  }
);

// ✅ Sync models with database
const syncDatabase = async ({ force = false, alter = false } = {}) => {
  try {
    await sequelize.sync({ force, alter });
    console.log('✅ Database synchronized.');
  } catch (error) {
    console.error('❌ Failed to sync database:', error);
  }
};

// ✅ Test connection and sync
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    await syncDatabase(); // <- Sync after connection
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };