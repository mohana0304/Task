const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("KTTs", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type:DataTypes.STRING,
    validate:{
      isNumeric:true,
    }
  },
  name: {
    type:DataTypes.STRING,
    validate:{
      notEmpty: true,
    }
  },
  role: DataTypes.STRING,
  email:{
    type:DataTypes.STRING,
    validate:{
      isEmail: true,
    }
  },
  mobile:{
    type:DataTypes.STRING,
    validate:{
      isNumeric:true,
      len:[10,10]
    }
  }, 
  branches: DataTypes.STRING,
  status:{
    type:DataTypes.STRING,
    validate:{
      isIn:[['Active','Inactive']]
    }
  } 
});

module.exports = User;