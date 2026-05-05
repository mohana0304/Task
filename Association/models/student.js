const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Student', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement:true
    },
    name:DataTypes.STRING,
    email:DataTypes.STRING,
    age:DataTypes.INTEGER
  });
};