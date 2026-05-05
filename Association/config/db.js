
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('association', 'postgres', 'Mohana@0304', {
  host: 'localhost',
  dialect: 'postgres',
});

module.exports = sequelize;
