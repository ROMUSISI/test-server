const {sequelize} = require ('../databaseConnection/db')
const {DataTypes} = require ('sequelize')

const District = sequelize.define (
  'District', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    districtName: {
      type: DataTypes.STRING,
    }
  },
  {
    tableName: 'District',
    freezeTableName: true,
    timestamps: false
  }
);

module.exports = District;