//Model initialization and Association

const Sequelize= require("sequelize");
const sequelize = require("../config/db");

const db={};

db.sequelize=sequelize;

//import models
db.Employee=require('./employee')(sequelize,Sequelize.DataTypes);
db.Profile=require('./profile')(sequelize,Sequelize.DataTypes);
db.Department=require('./department')(sequelize,Sequelize.DataTypes);
db.Project=require('./project')(sequelize,Sequelize.DataTypes);

//Association
db.Employee.hasOne(db.Profile,{foreignKey:"employeeId"});
db.Profile.belongsTo(db.Employee,{foreignKey:"employeeId"});
//profile table add column employeeId

db.Department.hasMany(db.Employee,{foreignKey:'departmentId'});
db.Employee.belongsTo(db.Department,{foreignKey:'departmentId'});
//employee table add column departmentId

db.Employee.belongsToMany(db.Project, { through: "EmployeeProjects" });
db.Project.belongsToMany(db.Employee, { through: "EmployeeProjects" });
//Creates a junction table: employeeProjects has employeeId ,projectId

module.exports=db;


