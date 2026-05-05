const {DataTypes} = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User',{
    name:{
        type:DataTypes.STRING,
    },
    email:{
        type:DataTypes.STRING,
    },
});

module.exports=User;