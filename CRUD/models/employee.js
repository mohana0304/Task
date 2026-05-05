
module.exports=(sequelize,DataTypes)=>{
const Employee = sequelize.define("Employee",{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement:true
    },
    name:{
        type:DataTypes.STRING,
        allowNull: false
    }
});
return Employee;
};
