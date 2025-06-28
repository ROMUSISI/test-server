const {sequelize} = require ('../databaseConnection/db');
const {DataTypes} = require ('sequelize');

const Category = sequelize.define (
  'Category', 
  {
    id: {
      type: DataTypes.STRING (50),
      primaryKey: true,
      allowNull: false
    }
  }, 
  {
    tableName: 'Category',
    timestamps: false,
    freezeTableName: true
  }
);

module.exports = Category;