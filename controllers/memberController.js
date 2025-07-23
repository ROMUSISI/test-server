const { smsAllMembersOrUsers } = require('../reusables/smsAllMembersOrUsers');
const memberService = require ('../services/memberService')

const getAllMembers = async (req, res) => {
  const {page, pageLimit, searchTerm} = req.query;

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

  //console.log('User info in member controller', req.user)

  //console.log ({controllerPage: page, controllerpageLimit: pageLimit})
  try {
    const response = await memberService.getAllMembers(page, pageLimit, searchTerm, userInfo);
    //console.log ('My members for the new code in controller: ', response.members)
    //console.log ('Total count for the new code in controller: ', response.totalCount)
    if (response && response.status === 'OK') {
      return res.status (200).json (
        {
          totalCount: response.totalCount, 
          dataArray: response.members,
          message: response.message
        }
      )
    };

    if (response && response.status === 'No Content') {
      return res.status (404).json (
        {
          totalCount: response.totalCount, 
          dataArray: response.members,
          message: response.message
        }
      )
    };

    if (response && response.status === 'Error') {
      return res.status (400).json (
        {
          totalCount: response.totalCount, 
          dataArray: response.members,
          message: response.message
        }
      )
    };

  } catch (error) {

    console.error (error.message || 'Internal server error');

      return res.status (500).json (
        {
          totalCount: 0, 
          dataArray: [],
          message: 'Internal server error'
        }
      )
  }
}

//get member by id
const getMemberById = async (req, res) => {

  //destructure the id from params
  const {id} = req.params;
  try {
    
    const response = await memberService.getMemberById(id);

    //console.log ('Now checking controller: ', response)

    if (response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, member: response.member})
    }

    if (response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, member: response.member})
    }

    if (response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, member: response.member})
    }

  } catch (error) {

    console.error (error.message);
    return res.status (500).json ({status: "Error", message: "Internal server error", member: {}})
    
  }
}

//create member
const createMember = async (req, res) => {

  const userInfo = req.user;

  //destructure incoming member data
  const {
    unitId,
    memberName,
    memberType,
    dob,
    country,
    district,
    subcounty,
    parish,
    cell,
    createdByUserId,
    phone1,
    phone2,
    emailAddress,
    lastModifiedByUserId
  } = req.body;

  //pass the destructured variables to the memberData object
  const memberData = {
    unitId,
    memberName,
    memberType,
    dob,
    country,
    district,
    subcounty,
    parish,
    cell,
    createdByUserId,
    phone1,
    phone2,
    emailAddress,
    lastModifiedByUserId
  };

  try {
    const response = await memberService.createMember(memberData, userInfo);

    if(response && response.status === 'OK') {
      return res.status(201).json (
        {
          status: response.status, 
          message: response.message, 
          member: response.member, 
          newId: response.newId
        })   
    }

    if(response && response.status === 'Conflict') {
      return res.status(409).json (
        {
          status: response.status, 
          message: response.message, 
          member: response.member, 
          newId: response.newId
        })
    }

    if(response && response.status === 'Error') {
      return res.status(400).json (
        {
          status: response.status, 
          message: response.message, 
          member: response.member, 
          newId: response.newId
        })
    }

  } catch (error) {
    
    console.error (error.message);
    return res.status(500).json(
      {
        status: "Error", 
        message: error.message || 'Internal server Error', 
        member: {},
        newId: null
      })
  }
}

///Update member
const updateMember = async(req, res) =>{
  //destructure incoming data
  const {
    id,
    unitId,
    uniqueMemberId,
    memberName,
    memberType,
    dob,
    country,
    district,
    subcounty,
    parish,
    cell,
    status,
    phone1,
    phone2,
    emailAddress,
    deleted,
    lastModifiedByUserId,
    timeLastModified
  } = req.body;

  //now assign the destructured variables to member data
  const memberData = {
    id,
    unitId,
    uniqueMemberId,
    memberName,
    memberType,
    dob,
    country,
    district,
    subcounty,
    parish,
    cell,
    status,
    phone1,
    phone2,
    emailAddress,
    deleted,
    lastModifiedByUserId,
    timeLastModified,
  };

  try {
    const response = await memberService.updateMember(memberData);

    if (response && response.status === "OK") {
      return res.status(200).json ({status: response.status, message: response.message, member: response.member})
    }

    if (response && response.status === "Bad Request") {
      return res.status(400).json ({status: response.status, message: response.message, member: response.member})
    }

    if (response && response.status === "Error") {
      return res.status(400).json ({status: response.status, message: response.message, member: response.member})
    }

    if (response && response.status === "Not Found") {
      return res.status(404).json ({status: response.status, message: response.message, member: response.member})
    }

  } catch (error) {
    
    console.error (error.message || 'Error occurred while updating member');
    return res.status(500).json ({status: "Error", message: "Internal server error", member: {}})

  }

}

const deleteMember = async(req, res) => {

  const {staffName} = req.user;
  const {id} = req.body;

  try {

    const response = await memberService.deleteMember(id, staffName);

    if (response && response.status === 'OK') {
      return res.status(200).json({
        message: response.message
      })
    }

    if (response && response.status === 'Not Found') {
      return res.status(404).json({
        message: response.message
      })
    }

    if (response && response.status === 'Error') {
      return res.status(500).json({
        message: response.message
      })
    }

  } catch (error) {
    
    console.log('Internal server error encountered while deleting user Record', error)
      return res.status(500).json({
        message: 'Internal server error. Try again'
      })
  }
}

const smsAllMembers = async(req, res) => {
  //destructure the incoming request
  const {message, recipientType} = req.body;
  const {unitId} = req.user;
  try {

    const response = await smsAllMembersOrUsers (message.trim(), recipientType, unitId);

    if(response && response.status === 'OK'){
      return res.status(200).json({
        message: response.message
      })
    }

    if(response && response.status === 'Not Found'){
      return res.status(404).json({
        message: response.message
      })
    }

    if(response && response.status === 'Error'){
      return res.status(500).json({
        message: response.message
      })
    }

  } catch (error) {
    console.log('An error occurred while sending bulk messages to members: ', error);
    return res.status(500).json({
      message: 'An internal server error occurred while trying to send messages. Please try again'
    })
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  smsAllMembers
}