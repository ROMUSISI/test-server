const {sequelize} = require ('../databaseConnection/db');
const {DataTypes, QueryTypes} = require ('sequelize')

const User = sequelize.define (
  'User', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    unitId : {
      type: DataTypes.STRING (50),
      allowNull: false
    },
    userName: {
      type: DataTypes.STRING (50),
      allowNull: false
    },
    staffName: {
      type: DataTypes.STRING (50),
      allowNull: false
    },
    staffIdNumber: {
      type: DataTypes.STRING (50)
    },
    password: {
      type: DataTypes.STRING (250),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING (50),
      allowNull: false
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0
    },
    dateTimeCreated: {
      type: DataTypes.DATE,
      defaultValue: sequelize.fn('NOW')
    },
    createdBy: {
      type: DataTypes.STRING (50),
      allowNull: false
    },
    lastModified: {
      type: DataTypes.DATE,
      defaultValue: sequelize.fn('NOW')
    },
    lastModifiedBy: {
      type: DataTypes.STRING(50),
      defaultValue: 'None' 
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    },
    email: {
      type: DataTypes.STRING(50)
    },
    phone: {
      type: DataTypes.STRING(50)
    },
    token: {
      type: DataTypes.STRING (250),
      allowNull: true
    },
    tokenVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    tokenCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    accountToken: {
      type: DataTypes.STRING (250),
      allowNull: true
    },
    accountTokenCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userBlocked: {
      type: DataTypes.BOOLEAN
    },
    passwordDraft: {
      type: DataTypes.STRING (250),
      allowNull: true
    }
  },
  {
    tableName: 'User',
    freezeTableName: true,
    timestamps: false
  }

);

module.exports = User;