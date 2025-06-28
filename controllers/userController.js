const userService = require ('../services/userService');

//get all users
const getAllUsers = async (req, res) => {

  //destructure user info passed from middle ware.
  const { username,
          staffName,
          unitId,
          role,
          userId
        } = req.user;

  const userInfo = {  username,
                      staffName,
                      unitId,
                      role,
                      userId
                   }

  console.log('User info in user controller', req.user)

  //destructure the params from the incoming request

  const {page, pageLimit, searchTerm} = req.query;

  const myParams = {page, pageLimit, searchTerm};

  console.log( 'params in the controller layer', myParams);

  try {
    const response = await userService.getAllUsers(myParams, userInfo);

    console.log ('All retrieved users in controller layer: ', response);

    if(response && response.status === 'OK') {
      return res.status(200).json(
        {
          status: response.status, 
          message: response.message, 
          dataArray: response.dataArray, 
          totalCount: response.totalCount
        }
      );
    }

    if(response && response.status === 'Not Found') {
      return res.status(404).json(
        {
          status: response.status, 
          message: response.message, 
          dataArray: response.dataArray, 
          totalCount: response.totalCount
        }
      );
    }

    if(response && response.status === 'Error') {
      return res.status(500).json(
        {
          status: response.status, 
          message: response.message, 
          dataArray: response.dataArray, 
          totalCount: response.totalCount
        }
      );
    }

  } catch (error) {
    console.error(error.message || 'Internal server error');
    res.status(500).json(
      {
        status: 'Error', 
        message: error.message || 'Internal server Error', 
        dataArray: [], 
        totalCount: 0
      }
    );
  };
}

const getUserById = async(req, res) => {

  //destructure the id out
  const {id} = req.params;

  try {
    const response = await userService.getUserById (id);
    if(response) {
      return res.status(200).json(response);
    } else {
      return res.status(404).send ('User record not found')
    }
  } catch (error) {
    console.error (error);
    return res.status(500).send ('Internal server error')
  }
}

//delete user
const deleteUser = async(req, res) => {

  //destructure id from params object
  const {id} = req.params;
  try {
    const response = await userService.deleteUser(id)
    
    if (response === 'deleted'){
      return res.status(201).send('User record successifully deleted')
    }
    else if (response === 'notDeleted'){
      return res.status(404).send('Record not deleted')
    }
    else if (response === 'notFound') {
      return res.status(404).send('User record not found')
    }
    
  } catch (error) {
    console.error (error);
    return res.status(500).send ('internal server error')
  }
}

const createUser = async (req, res) => {

  const {
    unitId,
    userName,
    staffName,
    staffIdNumber,
    password,
    role,
    email,
    phone,
    createdBy,
    lastModifiedBy,
  } = req.body;

  const userData = {
      unitId ,
      userName,
      staffName,
      staffIdNumber,
      password,
      role,
      email,
      phone,
      createdBy,
      lastModifiedBy,
  };

  //Confirm that all fields are provided

  if (!unitId || !userName || !staffName || !password || !role) {

    return res.status(400).json ({status: "badRequest", message: "Missing required field(s)", user: {}})

  };

  try {

    const response = await userService.createUser(userData);

    if (response && response.status === "success") {
      return res.status (201).json({status: response.status, message: response.message, user: response.user})
    };

    if (response && response.status === "conflict") 
      return res.status (409).json ({status: response.status, message: response.message, user: response.user});

    if (response && response.status === "error") 
      return res.status (409).json ({status: response.status, message: response.message, user: response.user});

  } catch (error) {

    console.error (error)

    return res.status(500).send({message: 'internal server error'});

  }
}

//login logic
const login = async(req, res) => {

  //destructure user data from body
  const {
    userName,
    password
  } = req.body;

  const userData = {userName, password};

  //Check for required fields
  if (!userName || !password) {

    return res.status(400).json({status: "badRequest", message: "Both user name and password are required"})

  };


  try {

    const response = await userService.login (userData);

    if (response && response.status === "OK") {
      
         return res.status(200).json ({message: response.message, token: response.token})
    }

    if (response && response.status === "Unauthorized") {
      return res.status(401).json ({message: response.message})
    }

    if (response && response.status === "Not Found") {
      return res.status(404).json ({message: response.message})
    }

    if (response && response.status === "error") {
      return res.status(400).json ({message: response.message})
    }

  } catch (error) {

    return res.status(500).json ({message: error.message || "Internal server error"})

  }
};

//update user
const updateUser = async (req, res) => {
  //destructure incoming userData from the request
  const {
    id,
    userName,
    staffName,
    staffIdNumber,
    password,
    role,
    email,
    phone,
    unitId,
    deleted,
    lastModifiedBy,
    isActive
  } = req.body;

  //assign the destructured variables to the userData object
  const userData = {
    id,
    userName,
    staffName,
    staffIdNumber,
    password,
    role,
    email,
    phone,
    unitId,
    deleted,
    lastModifiedBy,
    isActive
  };

  try {

    const response = await userService.updateUser (userData);

    if (response && response.status === 'OK') {
      return res.status(200).json({status: response.status, message: response.message, user: response.user})
    }

    if (response && response.status === 'Not Found') {
      return res.status(404).json({status: response.status, message: response.message, user: response.user})
    }

    if (response && response.status === 'Bad Request') {
      return res.status(400).json({status: response.status, message: response.message, user: response.user})
    }

    if (response && response.status === 'Error') {
      return res.status(400).json({status: response.status, message: response.message, user: response.user})
    }

  } catch (error) {
    
    console.error (error.message || 'Internal server error');
    return res.status(500).json({status: 'Error', message: 'Internal server error', user: {}})

  }

}

const verifyUserName = async(req, res) => {
  const {userName} = req.body

  try {

    const response = await userService.verifyUserName(userName)
    
    if(response && response.status === 'OK') {
      return res.status(200).json({
        verified: response.verified,
        userName: response.userName,
        message: response.message
      })
    }

    if(response && response.status === 'Not Found') {
      return res.status(404).json({
        verified: response.verified,
        userName: response.userName,
        message: response.message
      })
    }

    if(response && response.status === 'Error') {
      return res.status(500).json({
        verified: response.verified,
        userName: response.userName,
        message: response.message
      })
    }

  } catch (error) {
    console.log ('An internal server error occurred while verifying user:', error)
    return res.status(500).json({
        verified: false,
        userName: '',
        message: 'An internal server error occured while verifying user'
    })
  }
}

const verifyToken = async(req, res) => {

  //destructure user name and token from request
  const{userName, token} = req.body;

  console.log('checking user name and token in controller: ', 'User name:', userName, 'token: ', token)

  try {

    const response = await userService.verifyToken(token, userName)

    if(response && response.status === 'OK') {
      return res.status(200).json({
        verified: response.verified,
        message: response.message
      });
    }

    if(response && response.status === 'Not Found') {
      return res.status(404).json({
        verified: response.verified,
        message: response.message
      });
    }

    if(response && response.status === 'Error') {
      return res.status(500).json({
        verified: response.verified,
        message: response.message
      });
    }

    
  } catch (error) {

    console.log('An internal server error occurred while verifying token. Try again', error)

    return res.status(500).json({
      verified: false,
      message: 'An internal server error occurred while verifying token. Try again'
    });
    
  }
}

const createPassword = async(req, res) => {

  //destructure the user name and password from req
  const {userName, password} = req.body;

  try {

    const response = await userService.createPassword(password, userName);

    if(response && response.status === 'OK') {
      return res.status(200).json({
        passwordCreated: response.passwordCreated,
        message: response.message
      })
    }

    if(response && response.status === 'Not Found') {
      return res.status(404).json({
        passwordCreated: response.passwordCreated,
        message: response.message
      })
    }

    if(response && response.status === 'Error') {
      return res.status(500).json({
        passwordCreated: response.passwordCreated,
        message: response.message
      })
    }

  } catch (error) {

      console.log('An internal server error ocurred while creating password: ', error);
      
      return res.status(500).json({
        passwordCreated: false,
        message: 'An internal server error ocurred while creating password. Try again.'
      })
    
  }
};

const confirmPassword = async(req, res) => {
  const {password, userName} = req.body;

  console.log (
    'user name and password: ', userName, password
  )
  try {

    const response = await userService.confirmPassword(userName, password);

    if(response && response.status === 'OK') {

      return res.status(200).json({
        message: response.message,
        confirmed: response.confirmed
      })

    }

    if(response && response.status === 'Not Found') {

      return res.status(404).json({
        message: response.message,
        confirmed: response.confirmed
      })

    }

    if(response && response.status === 'Error') {

      return res.status(500).json({
        message: response.message,
        confirmed: response.confirmed
      })

    }

  } catch (error) {

    console.log('Error confirming password: ', error);

      return res.status(500).json({
        message: `An internal server error occurred while confirming password. Try again`,
        confirmed: false
      })

  }
}

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  createUser, 
  login,
  updateUser,
  verifyUserName,
  verifyToken,
  createPassword,
  confirmPassword
};