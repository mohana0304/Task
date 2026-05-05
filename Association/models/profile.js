const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Profile', {
    id: {
         type: DataTypes.INTEGER, 
         primaryKey: true, 
         autoIncrement: true 
        },
    name: {
         type: DataTypes.STRING, 
         allowNull: false 
        },
    bio:{
        type: DataTypes.TEXT
    },
    age:DataTypes.INTEGER,
    gender:DataTypes.STRING,
    address:DataTypes.STRING,
    phone:DataTypes.STRING
});
};