const {sequelize} = require ('../databaseConnection/db');
const {DataTypes} = require ('sequelize');

const Country = sequelize.define (
  'Country', 
  {
    id: {
      type: DataTypes.STRING (50),
      primaryKey: true,
      allowNull: false
    }
  }, 
  {
    tableName: 'Country',
    timestamps: false,
    freezeTableName: true
  }
);

module.exports = Country;