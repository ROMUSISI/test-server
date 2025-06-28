const {sequelize} = require ('../databaseConnection/db');
const {DataTypes} = require ('sequelize');

const Unit = sequelize.define (
  'Unit', 
  {
    id: {
      type: DataTypes.STRING (50),
      primaryKey: true,
      allowNull: false
    }
  }, 
  {
    tableName: 'Unit',
    timestamps: false,
    freezeTableName: true
  }
);

module.exports = Unit;