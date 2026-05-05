const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Post', {
    id:{type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement:true
    },
    title:DataTypes.STRING,
    content:DataTypes.TEXT,
    status:{
        type:DataTypes.ENUM('draft','pulished'),
        defaultValue:'draft'
    } ,
    views:{
        type:DataTypes.INTEGER,defaultValue:0
    }
  });
};