const { tryCatch } = require('bullmq');
const messageService = require('../services/messageService')

const handleMemberMessages = async(req, res) => {
  const{userId} = req.user;
  const {message, action} = req.body;

  try {
    let response;

    if (action === 'draft') {
      response = await messageService.handleDraftMemberMessages(message, userId);
    } else if (action === 'send') {
      response = await messageService.handleSendMemberMessages(message, userId)
    }

    if(response && response.status === 'Bad Request') {
      res.status(400).json({
        message: response.message
      })
    }

    if(response && response.status === 'Not Found') {
      res.status(404).json({
        message: response.message
      })
    }

    if(response && response.status === 'OK') {
      res.status(201).json({
        message: response.message
      })
    }

    if(response && response.status === 'Error') {
      res.status(500).json({
        message: response.message
      })
    }
    
  } catch (error) {
    console.log('An error occurred while handling member messages: ', error)
      res.status(500).json({
        message: 'An internal server error occurred while saving the message as draft. Try again'
      })
  }
};

const getAllMessages = async(req, res) => {

  const {unitId, userId} = req.user;
  const {pageLimit, page, messageType} = req.body;

  console.log('message type inside controller: ', messageType);

  try {
    const response = await messageService.getAllMessages(userId, pageLimit, page, unitId, messageType);

    if(response && response.status === 'Not Found') {
      return res.status(404).json({
        message: response.message,
        messagesArray: response.messagesArray,
        totalPages: response.totalPages
      })
    }

    if(response && response.status === 'OK') {
      console.log('messages array inside controller: ', response.messagesArray)
      return res.status(200).json({
        message: response.message,
        messagesArray: response.messagesArray,
        totalPages: response.totalPages
      })
    } 

    if(response && response.status === 'Error') {
      return res.status(500).json({
        message: response.message,
        messagesArray: response.messagesArray,
        totalPages: response.totalPages
      })
    };

  } catch (error) {
    console.log('An error happened while retrieving message data: ', error);
      return res.status(500).json({
        message: 'An internal server error happned while retrieving messages data',
        messagesArray: [],
        totalPages: 0
      })
  }
};


const getMessageCounts = async(req, res) => {
  try {
    const response = await messageService.getMessageCounts();
    if(response && response.status === 'OK') {
      return res.status(200).json ({
        message: response.message,
        totals: response.totals
      })
    }
  } catch (error) {
    console.log('An error happened in the controller while getting message totals: ', error);
    return res.status(500).json ({
        message: 'An internal server error happened while retrieving message totals',
        totals: {}
      })
  }
};

module.exports = {
  handleMemberMessages,
  getAllMessages,
  getMessageCounts
};