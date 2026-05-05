const { DataTypes } = require("sequelize");
const sequelize = require("./db"); // make sure db.js exists

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = User;