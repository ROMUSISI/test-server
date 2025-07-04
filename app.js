const express = require ('express')
const app = express();
const cors = require ('cors');
const {sequelize, syncDb} = require('./databaseConnection/db')

//import routes
const districtRoutes = require ('./routes/districtRoutes')
const userRoutes = require ('./routes/userRoutes')
const memberRoutes = require ('./routes/memberRoutes')
const subscriptionRoutes = require ('./routes/subscriptionRoutes')
const categoryRoutes = require ('./routes/categoryRoutes')
const unitRoutes = require ('./routes/unitRoutes')
const countryRoutes = require ('./routes/countryRoutes')
const roleRoutes = require ('./routes/roleRoutes')
const dashboardRoutes = require ('./routes/dashboardRoutes')
const testRoutes = require('./routes/testRoutes')
const dotenv = require ('dotenv');


// import models
const District = require ('./models/district')
const User = require ('./models/User')
const Member = require ('./models/member')
const Subscription = require ('./models/subscription')
const Category = require('./models/category')
const Unit = require('./models/unit')
const Role = require('./models/role')
const Country = require('./models/country');
const cookieParser = require('cookie-parser');


dotenv.config();
const port = process.env.PORT || 7000

app.use(cors());


app.use(express.json());
app.use(cookieParser())

app.use(districtRoutes);
app.use(userRoutes);
app.use(memberRoutes);
app.use(subscriptionRoutes);
app.use(categoryRoutes);
app.use(unitRoutes);
app.use(countryRoutes);
app.use(roleRoutes);
app.use(dashboardRoutes);
app.use(testRoutes);

const startServer = async() => {      //function to start server
  try {

    syncDb();                          //sync database


    app.listen (port, () => {
      console.log (`server is listening on port ${port}`)
    })                                  //make server to listen on a specified port

  } catch (error) {
    console.error (`Failed to connect to server. Error: ${error}`)
  }
};

startServer (); //call function to start server
