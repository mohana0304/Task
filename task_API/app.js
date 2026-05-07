const express = require('express');
const sequelize=require('./config/db');
const User=require('./models/User');
const { USE } = require('sequelize/lib/index-hints');

const app =express();
app.use(express.json());

//connect DB
sequelize.authenticate()
    .then(() => console.log('Connected to postgreSQL'))
    .catch(err => console.error('DB connection error: ',err));

//create table if not exists
sequelize.sync()
    .then(()=>console.log(' Tables created'))
    .catch(err=>console.log(err));

//Create
app.post('/users',async(req,res)=>{
    try{
        const user = await User.create(req.body);
        res.status(201).json(user);
    }catch(err){
        res.status(500).json({message : 'Error inserting data'});
    }
});

//Read all
app.get('/users',async(req,res)=>{
    try{
        const users = await User.findAll();
        res.json(users);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

//Read one
app.get('/users/:id',async(req,res)=>{
    try{
        const user = await User.findByPk(req.params.id);
        if(!user){
            return res.status(404).json({message:'User not found'});
        }
        res.json(user);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

//update
app.put('/users/:id',async(req,res)=>{
    try{
        const [updated]= await User.update(req.body,{
            where:{id:req.params.id}
        });
        if(!updated){
            return res.status(404).json({message: 'User not found'});
        }
        const updateUser = await User.findByPk(req.params.id);
        res.json(updateUser);
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

//delete
app.delete('/users/:id',async(req,res)=>{
    try{
        const deleted = await User.destroy({
            where:{id:req.params.id}
        });
        if(!deleted){
            return res.status(404).json({message:'User not found'});
        }
        res.json({message: 'Deleted successfully'});
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

app.listen(3000,()=>{
    console.log('Server running at http://localhost:3000');
});

