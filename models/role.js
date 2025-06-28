const {sequelize} = require ('../databaseConnection/db');
const {DataTypes} = require ('sequelize');

const Role = sequelize.define (
  'Role', 
  {
    id: {
      type: DataTypes.STRING (50),
      primaryKey: true,
      allowNull: false
    }
  }, 
  {
    tableName: 'Role',
    timestamps: false,
    freezeTableName: true
  }
);

module.exports = Role;