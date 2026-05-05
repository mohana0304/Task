const db=require("../models");
const Employee=db.Employee;
const Department=db.Department;
const Profile=db.Profile;

exports.createEmployee = async(req,res)=>{
    const emp=await Employee.create(req.body);
    res.json(emp);
};

exports.getEmployees=async(req,res)=>{
    const employees=await Employee.findAll({
        include:[Department,Profile]
    });
    res.json(employees);
};

exports.updateEmployee=async(req,res)=>{
    await Employee.update(req.body,{
        where:{id:req.params.id}
    });
    res.send("updated");
};

exports.deleteEmployee=async(req,res)=>{
    await Employee.destroy(req.body,{
        where:{id:req.params.id}
    });
    res.send("Deleted");
};