const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Enrollment', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    enrolled_at: { 
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW 
    },
    grade: DataTypes.STRING
  });
};