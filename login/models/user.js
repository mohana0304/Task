const {DataTypes} =require('sequelize');
const sequelize=require('../config/database');
const User=sequelize.define('User1',{
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
    },
    email:{
        type: DataTypes.STRING,
        allowNull:false,
        unique:true,
        validate:{
            isEmail:true
        }
    },
    password:{
        type: DataTypes.STRING,
        allowNull:false
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },

    otpExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    profile:{
        type: DataTypes.JSONB,
        defaultValue:{
            role:'user',
            preferences:{}
        }
    }
});
module.exports=User;
