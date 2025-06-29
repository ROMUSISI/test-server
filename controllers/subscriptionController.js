const { response } = require('express');
const subscriptionService = require ('../services/subscriptionService');

//get all subscriptions
const getAllMemberSubscriptions = async (req, res) => {

  try {
    
    const response = await subscriptionService.getAllMemberSubscriptions();

    if(response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, subscriptions: response.subscriptions})
    }

    if(response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, subscriptions: response.subscriptions})
    }

    if(response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, subscriptions: response.subscriptions})
    }

  } catch (error) {
    
    console.error (error.message || 'Internal server error');

    return res.status(500).json ({status: 'Error', message: 'Internal server error', subscriptions: []})
  }

}

//create payment
const createPayment = async(req, res) => {

  const userInfo = req.user;

  //destructure incoming patient data out of the req body
  const {

    uniqueMemberId,
    receivedByUserId,
    yearSubscribed,
    category,
    amountPaid,
    paymentMode

  } = req.body;

  //assign the destructured variables to the paymentData object
  const paymentData ={

    uniqueMemberId,
    receivedByUserId,
    yearSubscribed,
    category,
    amountPaid,
    paymentMode
    
  };

  

  try {

    const response = await subscriptionService.createPayment(paymentData);
    console.log (response)
    if (!response) console.log ('No response')
    if (response && response.status === 'OK') {
      
      return res.status(201).json({status: response.status, message: response.message, payment: response.payment})
    }

    if (response && response.status === 'Bad Request') {
      return res.status(400).json({status: response.status, message: response.message, payment: response.payment})
    }

    if (response && response.status === 'Error') {
      return res.status(400).json({status: response.status, message: response.message, payment: response.payment})
    }

    if (response && response.status === 'Conflict') {
      return res.status(409).json({status: response.status, message: response.message, payment: response.payment})
    }

    
  } catch (error) {
    console.error (error.message || 'Error processing payment')
    return res.status(500).json({status: 'Error', message: error.message || 'Error processing payment', payment: {}})
  }
}

//get all payments
const getAllPayments = async(req, res) => {

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

  //console.log('User info in subscription/payments controller', req.user)

  //destructure the variables from the incoming req.params object to get the page limit, page number and search terms

  const {page, pageLimit, searchTerm, myFiltersObject} = req.query;
  const myParams = {page, pageLimit, searchTerm, myFiltersObject};

  console.log(`My params page: ${page}, pageLimit: ${pageLimit}`);
  console.log(myFiltersObject);

  try {

    const response = await subscriptionService.getAllPayments(myParams, userInfo);

    if (response && response.status === 'OK') {
      return res.status(200).json(
        { status: response.status, 
          message: response.message, 
          payments: response.payments,
          totalCount: response.totalCount
         }
      )
    }

    
    if (response && response.status === 'Not Found') {
      return res.status(404).json(
        { status: response.status, 
          message: response.message, 
          payments: response.payments,
          totalCount: response.totalCount
        }
      )
    }

    
    if (response && response.status === 'Error') {
      return res.status(400).json(
        { status: response.status, 
          message: response.message, 
          payments: response.payments,
          totalCount: response.totalCount
        }
      )
    }

  } catch (error) {
    
    console.error (error.message || 'Internal server error');

    return res.status.json(500).json (
      { status: 'Error', 
        message: `Server Error: ${error.message}` || 'Internal server error',
        payments: response.payments,
        totalCount: response.totalCount
      }
    )
  }
};

const getPaymentById = async (req, res) => {
  const {id} = req.params;
  console.log(typeof id);
  try {

    const response = await subscriptionService.getPaymentById(parseInt(id))

    if (response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, payment: response.payment})
    }

    if (response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, payment: response.payment})
    }

    if (response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, payment: response.payment})
    }
  } catch (error) {
    console.error (error.message || 'Internal server error');
    return res.status(500).json ({status:'Error', message: 'Internal server Error', payment: {}})
  }
}

const getAllPaymentsByMemberId = async (req, res) => {
  //destructure the unique memberId from the params object
  const {id} = req.params;
  try {
    const response = await subscriptionService.getAllPaymentsByMemberId(id)
    if (response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, payments: response.payments})
    }
    if (response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, payments: response.payments})
    }
    if (response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, payments: response.payments})
    }
  } catch (error) {
    console.log(error.message || 'Internal server error');
      return res.status(500).json ({status: 'Error', message: error.message || 'Internal server error', payments: []})
  }
};

const updatePayment = async (req, res) => {

  //destructure variables from the incoming request and pass it to newPaymentData
  const {id, amountPaid, lastModifiedByUserId, deleted} = req.body;
  const newPaymentData = {id, amountPaid, lastModifiedByUserId, deleted};

  try {

    const response = await subscriptionService.updatePayment(newPaymentData);
    if (response && response.status === 'OK') {
      return res.status(201).json ({status:response.status, message: response.message, updatePayment: response.updatedPayment })
    }

    if (response && response.status === 'Not Found') {
      return res.status(404).json ({status:response.status, message: response.message, updatePayment: response.updatedPayment })
    }

    if (response && response.status === 'Error') {
      return res.status(400).json ({status:response.status, message: response.message, updatePayment: response.updatedPayment })
    }

  } catch (error) {
    console.log (error.message || 'Internal server error');
    return res.status(500).json ({status:'Error', message: error.message || 'Internal server error', updatePayment: [] })
  }
}

//get all payments
const getUnconfirmedPayments = async(req, res) => {

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

  //console.log('User info in subscription/payments controller', req.user)

  //destructure the variables from the incoming req.params object to get the page limit, page number and search terms

  const {page, pageLimit} = req.query;
  const myParams = {page, pageLimit};

  console.log(`My params page for unconfirmed payments: ${page}, pageLimit: ${pageLimit}`);

  try {

    const response = await subscriptionService.getUnconfirmedPayments(myParams, userInfo);

    if (response && response.status === 'OK') {
      return res.status(200).json(
        { status: response.status, 
          message: response.message, 
          payments: response.payments,
          totalCount: response.totalCount
         }
      )
    }

    
    if (response && response.status === 'Not Found') {
      return res.status(404).json(
        { status: response.status, 
          message: response.message, 
          payments: response.payments,
          totalCount: response.totalCount
        }
      )
    }

    
    if (response && response.status === 'Error') {
      return res.status(400).json(
        { status: response.status, 
          message: response.message, 
          payments: response.payments,
          totalCount: response.totalCount
        }
      )
    }

  } catch (error) {
    
    console.error (error.message || 'Internal server error');

    return res.status.json(500).json (
      { status: 'Error', 
        message: `Server Error: ${error.message}` || 'Internal server error',
        payments: response.payments,
        totalCount: response.totalCount
      }
    )
  }
};

const confirmPayments = async(req, res) => {
  //destructure pending payments from incoming req object;
  const {pendingArray} = req.body

  console.log ('my paending array in controller: ', pendingArray)
  try {

    const response = await subscriptionService.confirmPayments(pendingArray)

    if(response && response.status === 'OK') {
      return res.status(200).json({
        status: response.status,
        message: response.message,
        confirmedPayments: response.confirmedPayments,
        unconfirmed: response.unconfirmed
      })
    }

    if(response && response.status === 'Error') {
      return res.status(400).json({
        status: response.status,
        message: response.message,
        confirmedPayments: response.confirmedPayments,
        unconfirmed: response.unconfirmed
      })
    }

  } catch (error) {
    
      console.log('Internal server error: ', error)

      return res.status(500).json({
        status: 'Error',
        message: 'Internal server error',
        confirmedPayments:0,
        unconfirmed: 0
      })

  }
}

const deleteManyPayments = async(req, res) => {

  const {pendingArray} = req.body

  console.log('pending payments array in subscription controller: ', pendingArray)

  try {

    const response = await subscriptionService.deleteManyPayments(pendingArray);

    console.log ('delete many payments server response: ', response)

    if (response && response.status === 'OK') {

      return res.status(200).json({
        status: response.status,
        message: response.message,
        stillUnconfirmed: response.stillUnconfirmed
      })

    }

      if (response && response.status === 'Error') {

      return res.status(204).json({
        status: response.status,
        message: response.message,
        stillUnconfirmed: response.stillUnconfirmed
      })

    }

    
      if (response && response.status === 'No Content') {

      return res.status(204).json({
        status: response.status,
        message: response.message,
        stillUnconfirmed: response.stillUnconfirmed
      })

    }

  } catch (error) {

    console.log ('Internal server error: ', error)

      return res.status(500).json({
        status: response.status,
        message: 'Internal server error: ', error,
        stillUnconfirmed: 0
      })

  }

}

const checkTokenStatus = async(req, res) => {

  const {userId, phone} = req.user;
  const userInfo = {userId, phone};


  try {

    const response = await subscriptionService.checkTokenStatus(userInfo)

    if(response && response.status === 'OK') {
      return res.status(200).json({
        tokenStatus: response.tokenStatus
      })
    }

    if(response && response.status === 'Not Found') {
      return res.status(404).json({
        tokenStatus: response.tokenStatus
      })
    }

    if(response && response.status === 'Error') {
      return res.status(500).json({
        tokenStatus: response.tokenStatus
      })
    }

  } catch (error) {
    console.log('internal server error while verifying token: ', error)
      return res.status(500).json({
        tokenStatus: null
      })

  }
}

//create token
const createToken = async(req, res) => {

  console.log('User info in create token controller: ', req.user);

  const {userId, phone, email} = req.user;
  const userInfo = {userId, phone, email}

  try {

    const response = await subscriptionService.createToken(userInfo);
    
    if(response && response.status === 'OK') {

      return res.status(200).json({
        tokencreated: response.tokencreated,
        phone: response.phone
      })

    }

    if(response && response.status === 'Error') {

      return res.status(500).json({
        tokencreated: response.tokencreated,
        phone: response.phone
      })
      
    }

  } catch (error) {
    console.log ('internal server error while creating token: ', error)
    return ({
        tokencreated: false,
        phone: null
    })
  }
}

const verifyToken = async(req, res) => {

  console.log('verifying token in controller')

  const {phoneToken} = req.body;
  const {userId} = req.user;
  const userInfo = {userId}

  console.log('phone token in verify token: ', phoneToken, 'userId: ', userId);
  

  try {
    const response = await subscriptionService.verifyToken(userInfo, phoneToken)
    return res.status(200).json({
      tokenVerified : response.tokenVerified
    })
  } catch (error) {

    console.log('Internal server error verifying token: ', error);
    return  res.status(500).json({
      tokenVerified : false
    })
    
  }
}

module.exports = {
  getAllMemberSubscriptions,
  createPayment,
  getAllPayments,
  getPaymentById,
  getAllPaymentsByMemberId,
  updatePayment,
  getUnconfirmedPayments,
  confirmPayments,
  deleteManyPayments,
  checkTokenStatus,
  createToken,
  verifyToken
}