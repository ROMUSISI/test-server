const express = require ('express');
const cors = require ('cors')
const dotenv = require('dotenv')

dotenv.config();

const port = process.env.PORT || 7000
const app = express();
const { sequelize, testConnection } = require('./db');
const { QueryTypes } = require('sequelize');

app.use(cors());


//function to fetch fruits from mytest db
const getAllUsers = async(req, res) => {
  try {
    const response = await sequelize.query(
      `SELECT * FROM user`,
      {
        type: QueryTypes.SELECT
      }
    );

console.log('retrieved users: ', response)

    if(response && response.length>0) {
      console.log(response);
      return res.status(200).json({
        message: 'All users successifully retrieved',
        fruits: response
      })
    };

    if(!response || !response.length>0) {
      console.log('No user data was found');
      return res.status(404).json({
        message: 'No users were found',
        fruits: {}
      })
    }
  } catch (error) {
    console.log('Error while fetching user data: ', error);
      return res.status(500).json({
        message: 'An error occured while retrieving user data',
        fruits: {}
      })
  }
}

app.get('/fruits', getAllUsers)

app.listen(port, () => console.log(`Server is listening on port: ${port}`));
testConnection();


module.exports = app;