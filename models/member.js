const {sequelize} = require('../databaseConnection/db');
const {DataTypes} = require ('sequelize');

const Member = sequelize.define (
  "Member", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  unitId: {
    type: DataTypes.STRING (50),
    allowNull: false
  },
  uniqueMemberId: {
    type: DataTypes.STRING (50),
    allowNull: true
  },
  memberName: {
    type: DataTypes.STRING (50),
    allowNull: false
  },
  memberType: { //INSTITUTION or inidividual
    type: DataTypes.STRING (50),
    allowNull: false
  },
  dob: {
    type: DataTypes.DATEONLY
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  district:{
    type: DataTypes.STRING(50),
    allowNull: false
  },
  subcounty:{
    type: DataTypes.STRING(50),
    allowNull: false
  },
  parish:{
    type: DataTypes.STRING(50),
    allowNull: false
  },
  cell:{
    type: DataTypes.STRING(50),
    allowNull: false
  },
  createdByUserId: {
    type: DataTypes.INTEGER
  },
  timeCreated: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn ('NOW')
  }, 
  status: { //(active, inactive, partially paid)
    type: DataTypes.STRING(50),
    defaultValue: "inactive"
  },
  phone1: {
    type: DataTypes.STRING(50)
  },
  phone2: {
    type: DataTypes.STRING(50)
  },
  emailAddress: {
    type: DataTypes.STRING(50)
  },
  deleted:{//(true/false)
    type: DataTypes.BOOLEAN,
    defaultValue: 0
  },
  lastModifiedByUserId: {
    type: DataTypes.INTEGER
  },
  timeLastModified: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn ('NOW')
  },
  deletedBy: {
    type: DataTypes.STRING(50)
  }
  },
  {
    tableName: "Member",
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = {
  Member
}