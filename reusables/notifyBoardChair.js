//The purpose of this function is to send an email to the board chair,

const { getStaffInfo } = require("./getStaffInfo")

//The Executive director and the CAC chair for the respective center when a new member is registered.
const notifyBoardChair =  async(memberInfo) => {

  //get emails and names of the respective officers
  const {staffName: boardChairName, email: boardChairEmail} = await getStaffInfo('Chairman Board Of Trustees');
  const {staffName: edName, email: edEmail} = await getStaffInfo('Executive Director');
  
  
}