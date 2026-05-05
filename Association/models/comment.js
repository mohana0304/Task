const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Comment', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    text:DataTypes.TEXT,
    likes:{type:DataTypes.INTEGER,
        defaultValue:0
    }
  });
};