const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Course', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement: true
    },
    title:DataTypes.STRING,
    description:DataTypes.TEXT,
    duration:DataTypes.INTEGER
  });
};