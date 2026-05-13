const express = require('express');
const { Op } = require('sequelize');

const sequelize = require('./config/db');

const User = require('./models/User');
const Profile = require('./models/Profile');

const app = express();

app.use(express.json());

User.hasOne(Profile);
Profile.belongsTo(User);

sequelize.sync({ alter: true })
.then(() => {
    console.log('Database synced');
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes:['id','name','email'],
            where:{
                name:'John Doe'
            },
            include:[{
                model:Profile,
                attributes:['bio','city'],
                where:{
                    city:'New York'
                },
                required:true
            }],
           order:[
            ['name','ASC'],
            [{model:Profile},'city','DESC']
           ],
           raw:true,
           nest:true
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


app.listen(3000, () => {

    console.log('Server Running On Port 3000');

});