const { QueryTypes } = require("sequelize");
const { sequelize } = require("../databaseConnection/db");

const checkRoleDuplication = async(req, res, next) => {

  //destructure the user role and unitId of the user being registered or updated
  const {role, unitId, id} = req.body;
   
  try {
    
    console.log('Role of user being registered or edited: ',role, unitId )

    if(role === 'Head of unit' || role === 'M&E Officer' || role === 'unit admin/accountant') {

      const [existingRole] = await sequelize.query(
        `SELECT staffName, userName, id
         FROM User 
         WHERE role = :role
         AND unitId =  :unitId
         LIMIT 1`,
         {
          type: QueryTypes.SELECT,
          replacements: {role, unitId}
         }
      );

      if(existingRole && existingRole.id !== id) {
        return res.status(409).json({
          message: `A unit can only have one ${role} and ${existingRole.staffName} 
has already been assigned this role for ${unitId}.
Assign one of the two staffs another role eg. User. Thank you.`
        })
      }
    } 

    

  next()
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: `Action failed because error occured why verifying user role. Try again`
    })

  }
}

module.exports = {
  checkRoleDuplication
}