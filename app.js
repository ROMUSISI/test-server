const express = require ('express');
const cors = require ('cors')
const dotenv = require('dotenv')

dotenv.config();

const port = process.env.SERVER_PORT
const app = express();
const { sequelize, testConnection } = require('./db');
const { QueryTypes } = require('sequelize');

app.use(cors());

app.get('/cars', (req, res) => {
  res.status(200).json(
    [
      {name: 'Wish'},
      {name: 'LandCruiser'},
      {name: 'Volvo'},
      {name: 'Beast'}
    ]
  )
} );

//function to fetch fruits from mytest db
const getAllFruits = async(req, res) => {
  try {
    const response = await sequelize.query(
      `SELECT fruitName AS name FROM Fruit`,
      {
        type: QueryTypes.SELECT
      }
    );
    if(response && response.length>0) {
      console.log(response);
      return res.status(200).json({
        message: 'All fruits successifully retrieved',
        fruits: response
      })
    };

    if(!response || !response.length>0) {
      console.log('No fuit data was found');
      return res.status(404).json({
        message: 'No fruits were found',
        fruits: {}
      })
    }
  } catch (error) {
    console.log('Error while fetching fruit data: ', error);
      return res.status(500).json({
        message: 'A error occured while retrieving fruit data',
        fruits: {}
      })
  }
}

app.get('/fruits', getAllFruits)

app.listen(port, () => console.log(`Server is listening on port: ${port}`));
testConnection();


module.exports = app;