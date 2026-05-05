const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: {
         type: DataTypes.INTEGER, 
         primaryKey: true, 
         autoIncrement: true 
        },
    name: {
         type: DataTypes.STRING, 
         allowNull: false 
        },
    email: { 
        type: DataTypes.STRING, 
        unique: true 
    },
    password: { 
        type: DataTypes.STRING 
    },
    role: { 
        type: DataTypes.ENUM('admin', 'user'), 
        defaultValue: 'user' 
    },
    isActive: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
    }
  });
};