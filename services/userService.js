const {sequelize} = require ('../databaseConnection/db');
const {QueryTypes, Sequelize} = require ('sequelize');
const bcrypt = require ('bcryptjs');
const jwt = require ('jsonwebtoken');
const dotenv = require ('dotenv');
const { use } = require('../routes/memberRoutes');
const { createSignUpToken } = require('../reusables/createSignUpToken');
const { notifyNewUser } = require('../reusables/notifyNewUser');
dotenv.config(); //enable access to .env key-value pairs

//get all users
const getAllUsers = async (params, userInfo) => {
  const { username, staffName, unitId, role, userId } = userInfo;
  const { page, pageLimit, searchTerm } = params;
  const offset = (parseInt(page) - 1) * parseInt(pageLimit);
  const limit = parseInt(pageLimit);

  try {
    // Build base query
    let baseQuery = `
      SELECT 
        id, unitId, userName, staffName, staffIdNumber, password,
        role, deleted, dateTimeCreated, createdBy, lastModified,
        lastModifiedBy, isActive, email, phone
      FROM user
      WHERE 1=1

    `;

    const replacements = { limit, offset };

    // Add unit filter if not Director
    if (role !== 'Director') {
      baseQuery += ` AND (unitId = :unitId OR role = 'M&E Officer')`;
      replacements.unitId = unitId;
    }

    // Add search condition
    if (searchTerm) {
      baseQuery += `
        AND (
          userName LIKE CONCAT('%', :searchTerm, '%') OR
          staffName LIKE CONCAT('%', :searchTerm, '%') OR
          unitId LIKE CONCAT('%', :searchTerm, '%') OR
          staffIdNumber LIKE CONCAT('%', :searchTerm, '%') OR
          role LIKE CONCAT('%', :searchTerm, '%')
        )
      `;
      replacements.searchTerm = searchTerm;
    }

    // Add ordering, limit, and offset
    baseQuery += ` ORDER BY staffName LIMIT :limit OFFSET :offset`;

    // Execute main query
    const userDataArray = await sequelize.query(baseQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });

    // Build count query
    let countQuery = `SELECT COUNT(id) AS totalCount FROM user WHERE 1=1`;
    const countReplacements = {};

    if (role !== 'Director') {
      countQuery += ` AND (unitId = :unitId OR role = 'M&E Officer') `;
      countReplacements.unitId = unitId;
    }

    if (searchTerm) {
      countQuery += `
        AND (
          userName LIKE CONCAT('%', :searchTerm, '%') OR
          staffName LIKE CONCAT('%', :searchTerm, '%') OR
          unitId LIKE CONCAT('%', :searchTerm, '%') OR
          staffIdNumber LIKE CONCAT('%', :searchTerm, '%') OR
          role LIKE CONCAT('%', :searchTerm, '%')
        )
      `;
      countReplacements.searchTerm = searchTerm;
    }

    const countResult = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT,
      replacements: countReplacements,
    });

    const totalCount = countResult[0]?.totalCount || 0;

    if (!userDataArray || userDataArray.length === 0) {
      return {
        status: 'Not Found',
        message: 'Users not found',
        dataArray: [],
        totalCount: 0,
      };
    }

    return {
      status: 'OK',
      message: 'Users successfully retrieved',
      dataArray: userDataArray,
      totalCount,
    };
  } catch (error) {
    console.error('Error retrieving users:', error.message || error);
    return {
      status: 'Error',
      message: error.message || 'Error retrieving users',
      dataArray: [],
      totalCount: 0,
    };
  }
};


//get user by id

const getUserById = async (id) => {
  
  //define replacements map
  const replacements = {id};

  //define query to be executed
  const sql = `
    SELECT * FROM user WHERE id = :id
  `;

  //call the query method inside a try catch block
  try {
    const [user] = await sequelize.query (
      sql,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    console.log('retrieved user in service layer: ', user)

    if (user) {
      return ({
        status: 'OK',
        message: 'User was successifully retrieved',
        user: user
      })
    }
    else {
      return ({
        status: 'Not Found',
        message: 'User not found',
        user: {}
      })
    }
  } catch (error) {
    console.error ('Error retrieving user info: ', error)
    return ({
        status: 'Error',
        message: 'An error occurred while retrieving user info',
        user: {}
    })
  }
}

//delete user
const deleteUser = async (id) =>{

  //Define replacements map
  const replacements = {id}

  //define the queries for checking record existance and for deleting the record.
  const sqlExists = 'SELECT * FROM user WHERE id = :id';
  const sqlDelete = 'DELETE FROM user WHERE id = :id'

  //confirm record existance
  try {
    const exists = await sequelize.query (
      sqlExists, {
        replacements,
        type: QueryTypes.SELECT
      }
    );
  
    if (exists && exists[0]) {
      //delete the result
      const deleted = await sequelize.query (
        sqlDelete, {
          replacements,
          type: QueryTypes.DELETE
        }
      );
      if (!deleted) {
      return 'deleted';
      } else {
        return 'notDeleted'
      }
    } else {
      return 'notFound'
    }
    
  } catch (error) {
    console.error(error)
    throw error
  }
}

const createUser = async(userData) => {

  //destructure incoming userData
  const {
      unitId ,
      userName: newUser,
      staffName,
      staffIdNumber: newStaffIdNumber,
      role,
      email,
      phone,
      createdBy,
      lastModifiedBy,
  } = userData;
  
  //Define queries.
  const sqlUserExists = `
    SELECT userName, staffIdNumber 
    FROM user 
    WHERE (userName = :newUser) 
    LIMIT 1
  `
  //sql for inserting users
  const sqlInsertUser = `
    INSERT INTO user (
      unitId ,
      userName,
      staffName,
      staffIdNumber,
      role,
      email,
      phone,
      createdBy,
      lastModifiedBy
    )
    VALUES (
      :unitId ,
      :newUser,
      :staffName,
      :newStaffIdNumber,
      :role,
      :email,
      :phone,
      :createdBy,
      :lastModifiedBy
    )
  `;

  //define replacements map
  const insertReplacements = {
    unitId ,
    newUser,
    staffName,
    newStaffIdNumber,
    role,
    email,
    phone,
    createdBy,
    lastModifiedBy,
  };
  try {

    const userExists = await sequelize.query (
      sqlUserExists,
      {
        replacements: {newUser, newStaffIdNumber},
        type: QueryTypes.SELECT
      }
    )

    console.log('Existing user: ', userExists[0])

    if (userExists && userExists[0]) {  
        return {
          status: "conflict", 
          message: "User name or Staff Id Number already taken. Try again with another user name or staff id ", 
          user: userExists[0]
        }
    }

      //post new user
      const postedNewUser = await sequelize.query(
        sqlInsertUser, {
          replacements: insertReplacements,
          type: QueryTypes.INSERT
        }
      );

      if (postedNewUser) {
        const createdUser = await sequelize.query (
          `SELECT * from user
            WHERE 
            userName = :newUser 
            AND
            staffIdNumber = :newStaffIdNumber 
            LIMIT 1`, 
            {
            replacements : {
              newUser, newStaffIdNumber
            },
            type: QueryTypes.SELECT
            }
        );

        const {
          phone: userPhone, 
          email: userEmailAddress, 
          userName, 
          staffName, 
          unitId} = createdUser[0]

        const userInfo = {userPhone, userEmailAddress, userName, staffName, unitId}

        const loginLink = process.env.LOGIN_LINK

        //Notify new user through email and sms
        try {
          notifyNewUser(userInfo, loginLink)
        } catch (error) {
          console.error('AN error happened while nofifying a new user: ', error)
        }

      return {status: "success", message: "User successifully created", user: createdUser[0]};
      } else {
        return {status: "badRequest", message: "User creation failed. Try again", user: {}}
      }
  
  } catch (error) {
  console.error(error);
  return {status: "error", message: error.message || "Error ocurred while creating new user", user: {}} 
}
};

//LOGIN in logic
const login = async (userData) => {

  //destructure incoming userData
  const {
    userName : loggingUser,
    password : loggingPassword
  } = userData;

  const myUser = {
   loggingUser,
   loggingPassword
  };

  const replacementsExist = {
    loggingUser
  };

  try {
    const userExists = await sequelize.query (
      `SELECT *
      FROM user 
      WHERE userName = :loggingUser 
    `, 
      {
        replacements: replacementsExist,
        type: QueryTypes.SELECT
      }
    );

    console.log('user exists check in controller: ', userExists[0])

    if (!userExists || !userExists[0]) { //senareo 1: The user name can not be found in the database

      return ({status: "Not Found", message: "Wrong user name"})

    } else { //user name exists, verify the password

      const {password: storedHashedUserpassword} = userExists[0]

      const passwordMatches = await bcrypt.compare (loggingPassword, storedHashedUserpassword);

      if (!passwordMatches) { //password does not match

        return ({status: "Unauthorized", message: "Wrong password"});

      } else { //password matches

       
        //generate a json web token
        const token = jwt.sign(

          { username: userExists[0].userName,
            staffName: userExists[0].staffName,
            unitId: userExists[0].unitId,
            role: userExists[0].role,
            userId: userExists[0].id,
            phone: userExists[0].phone,
            email: userExists[0].email
          }, 
          
          process.env.JWT_SECRET, 
          
          {

            expiresIn: '2h' // Token expires in 2 hour

          }
        );

        const userInfo =
        { username: userExists[0].userName,
          staffName: userExists[0].staffName,
          unitId: userExists[0].unitId,
          role: userExists[0].role,
          userId: userExists[0].id,
          phone: userExists[0].phone,
          email: userExists[0].email
        }

        console.log('token generated in service layer after login', token, 'userInfo: ', userInfo); 

        return ({status: "OK", message: "Login was successiful", token, userInfo});

      }

    }

  } catch (error) {

    console.error(error);

    return ({status: "error", message: error.message || "Error logging in, try again"});

  }
}

//update user
const updateUser = async (userData) => {
  //destructure incoming userData
  const {
    id,
    userName: newUser,
    staffName: newStaffName,
    staffIdNumber: newStaffIdNumber,
    role: newRole,
    email: newEmail,
    phone: newPhone,
    unitId: newUnitId,
    lastModifiedBy: newLastModifiedBy
  } = userData;

  //define query for updating user record
  const sqlUpdateUser = `
    UPDATE user
    SET
      userName = :newUser,
      staffName = :newStaffName,
      staffIdNumber = :newStaffIdNumber,
      role = :newRole,
      phone = :newPhone,
      unitId = :newUnitId,
      email = :newEmail,
      lastModifiedBy = :newLastModifiedBy
    WHERE id = :id
  `

  //try catch block
  try {
    
    //first confirm that the user exists
    const userExistsArray = await sequelize.query (
      `
      SELECT * FROM user
      WHERE id = :id 
      LIMIT 1
      `,
      {
        replacements: {id},
        type: QueryTypes.SELECT
      }
    );

    if (!userExistsArray || !userExistsArray[0]) {
      return ({status: 'Not Found', message: 'User not found', user: {}})
    };

    if (userExistsArray && userExistsArray[0]) {

      //define replacements map
      const replacementsUpdateUser = {
        id,
        newUser,
        newStaffName,
        newStaffIdNumber,
        newRole,
        newPhone,
        newUnitId,
        newEmail,
        newLastModifiedBy
      };

      const updatedUserMetaDataArray = await sequelize.query (
        sqlUpdateUser,
        {
          replacements: replacementsUpdateUser,
          type: QueryTypes.UPDATE
        }
      );

      console.log('user update metadata: ', updatedUserMetaDataArray);

      if (!updatedUserMetaDataArray || !updatedUserMetaDataArray[1]>0) {
        return ({status: 'Bad Request', message: 'No changes were made to the record', user: {}})
      }

      if (updatedUserMetaDataArray && updatedUserMetaDataArray[1]>0) {
        
        //retrieve the updated document
        const updatedUserArray = await sequelize.query (
          `SELECT * FROM user
           WHERE id = :id
          `,
          {
            replacements: {id},
            type: QueryTypes.SELECT
          }
        );

        if (updatedUserArray && updatedUserArray[0]) {
          const myUpdatedUser = updatedUserArray[0];
          return ({status: 'OK', message: 'User successifully updated', user: myUpdatedUser})
        } else {
          return ({status: 'Bad Request', message: 'User update failed', user: {}})
        }
      }
    }
  } catch (error) {
    console.error (error.message || 'Error updating user');
    return ({status: 'Error', message: error.message || 'Error updating user', user: {}})
  }
}

const verifyUserName = async(userName) => {

  try {

  const [verifiedUser] = await sequelize.query(
    `SELECT staffName, id, phone, email, userName
     FROM user 
     WHERE userName = :userName
     LIMIT 1`,
     {
      type: QueryTypes.SELECT,
      replacements: {userName}
     }
  )

  console.log('verified user data in controller', verifiedUser)


  if(verifiedUser) {

    if(!verifiedUser.phone && !verifiedUser.email) {
      return ({
        status: 'OK',
        userName: verifiedUser.userName,
        verified: true,
        message: 'You can not proceed because your data is lacking both the phone number and email. Please contact your unit M&E to update your user account details'
      })
    }

    //generate token
    await createSignUpToken(verifiedUser)

    return ({
      status: 'OK',
      verified: true,
      userName: '',
      message: 'The username was successifully verified'
    })
  } 
  
  if(!verifiedUser){
    return ({
      status: 'Not Found',
      verified: false,
      userName: '',
      message: 'The username you entered does not exist'
    })
  }

  } catch (error) {

    console.log('An error occured while verifying the user name: ', error)
    return ({
      status: 'Error',
      verified: false,
      userName: '',
      message: 'An error occured while verifying the username'
    })

  }

}

const verifyToken = async(token, userName) => {
  try {
    const [hashedToken] = await sequelize.query(
      `SELECT 
       accountToken,
       accountTokenCreatedAt
       FROM user
       WHERE userName = :userName
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {userName}
       }
    );

    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    if(!hashedToken) {
      return ({
        status: 'Not Found',
        message: 'No token found. Try again.',
        verified: false
      })
    };

    console.log('hashed token from db: ', hashedToken)
    
    if (new Date(hashedToken.accountTokenCreatedAt) < twentyMinutesAgo) {
      return {
        status: 'Not Found',
        message: 'Token is expired. Try again',
        verified: false
      };
    }

    //compare hashed token with the incoming token
    const tokenMatches = await bcrypt.compare(token, hashedToken.accountToken);

    if(!tokenMatches) {
      return ({
        status: 'Not Found',
        message: 'The token you entered is invalid. Please try again',
        verified: false
      })
    };

    if(tokenMatches) {
      return ({
        status: 'OK',
        message: 'Token is valid. You were successifully verified',
        verified: true
      })
    }
  } catch (error) {
      console.log('Error occured while verifying sign up token: ', error)
      return ({
        status: 'Error',
        message: 'An error ocurred while verifying token. Please try again' + error,
        verified: false
      })
  }
}

const createPassword = async (password, userName) => {
  try {
    //hash password
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10))

    const [, affectedUsers] = await sequelize.query(
      `Update user
       SET passwordDraft = :hashedPassword
       WHERE userName = :userName`,
       {
        type: QueryTypes.UPDATE,
        replacements: {
          userName,
          hashedPassword
        }
       }
    );

    console.log('Afected rows: ', affectedUsers)

    if(!affectedUsers){
      return({
        status: 'Not Found',
        passwordCreated: false,
        message: 'Failed to create password. Try again'
      })
    }

    if(affectedUsers){
      return({
        status: 'OK',
        passwordCreated: true,
        message: 'Password was successifully created'
      })
    }


  } catch (error) {

      console('An error ocurred while creating password: ', error)

      return({
        status: 'Error',
        passwordCreated: false,
        message: 'An error ocurred while creating password. Try again'
      })
    
  }
};

const confirmPassword = async(userName, password) => {
  try {

    //Retrieve the password draft from db 

    const [passwordDraft] = await sequelize.query(
      `SELECT passwordDraft
       FROM user
       WHERE userName = :userName`,
       {
        type: QueryTypes.SELECT,
        replacements: {userName}
       }
    );

    console.log('password: ', password, 'passwordDraft: ', passwordDraft.passwordDraft)

    //Now compare the incoming  password with the existing draft

    const passwordMatches = await bcrypt.compare(
      password, passwordDraft.passwordDraft
    );

    if (!passwordMatches) {
      return({
        status: 'Not Found',
        confirmed: false,
        message: 'The two passwords do not match. Try again'
      })
    };

    if (passwordMatches) {

      //post the password to the password column and delete it from the draft column
      const [, passwordSet] = await sequelize.query(
        `UPDATE user
         SET password = passwordDraft,
         passwordDraft = NULL
         WHERE userName = :userName`,
         {
          type: QueryTypes.UPDATE,
          replacements: {
            userName
          }
         }
      );

      if(!passwordSet) {
        return({
          status: 'Not Found',
          confirmed: false,
          message: 'Failed to update password. Try again'
        })
      }

      return({
        status: 'OK',
        confirmed: true,
        message: 'Congratulations!\nYour password was successifully set.\nYou can now login'
      });

    };

  } catch (error) {

      console.log ('An error occurred while confirming password: ', error)
      return({
        status: 'Error',
        confirmed: false,
        message: 'An error occurred while setting password. Try again'
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
