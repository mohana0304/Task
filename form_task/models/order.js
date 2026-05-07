const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define("Orders", {

  item: DataTypes.STRING,
  ordQty: DataTypes.FLOAT,
  ordCost: DataTypes.FLOAT,
  ordGST: DataTypes.FLOAT,
  ordSGST: DataTypes.FLOAT,
  ordSGSTRs: DataTypes.FLOAT,
  ordCGST: DataTypes.FLOAT,
  ordCGSTRs: DataTypes.FLOAT,
  ordTotalGST: DataTypes.FLOAT,
  ordTaxlessTotal: DataTypes.FLOAT,
  ordGSTTotal: DataTypes.FLOAT,
  ordNetTotal: DataTypes.FLOAT,
  invQty: DataTypes.FLOAT,
  invCost: DataTypes.FLOAT,
  invGST: DataTypes.FLOAT,
  invSGST: DataTypes.FLOAT,
  invSGSTRs: DataTypes.FLOAT,
  invCGST: DataTypes.FLOAT,
  invCGSTRs: DataTypes.FLOAT,
  invTotalGST: DataTypes.FLOAT,
  discount: DataTypes.FLOAT,
  discountCost: DataTypes.FLOAT,
  invTaxlessTotal: DataTypes.FLOAT,
  invGSTTotal: DataTypes.FLOAT,
  invNetTotal: DataTypes.FLOAT

});

module.exports = Order;