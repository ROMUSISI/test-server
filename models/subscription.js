const {sequelize} = require ('../databaseConnection/db');
const {DataTypes} = require ('sequelize');

const Subscription = sequelize.define (
  'Subscription', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    uniqueMemberId: {
      type: DataTypes.STRING (50),
      allowNull: false
    },
    receivedByuserId: {
      type: DataTypes.INTEGER
    },
    timeReceived: {
      type: DataTypes.DATE,
      defaultValue: sequelize.fn ('NOW')
    },
    yearSubscribed: {  
      type: DataTypes.INTEGER,
      defaultValue: new Date().getFullYear()
    },
    category: {
      type: DataTypes.STRING(50),
    },
    categoryValue: {
      type: DataTypes.DECIMAL(10, 0),  
      allowNull: true
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 0)
    },
    balance: {
      type: DataTypes.DECIMAL(10, 0),  
    },
    deleted: {//(true/false)
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
    welfarePaid: {
      type: DataTypes.DECIMAL(10, 0)
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    tableName: 'Subscription',
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = {
  Subscription
}