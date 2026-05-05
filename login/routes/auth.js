//Authentication(Login logic) -verifies identity

const express =require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {body,validationResult} = require('express-validator');
const User=require('../models/user');
const { where } = require('sequelize');
const { auth } = require('../middlewares/auth');
const router=express.Router();

router.post('/login',
    [body('email').isEmail(),
     body('password').notEmpty()
    ],
    async(req,res)=>{ 
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        const {email,password} =req.body;
        const user= await User.findOne({where:{email}});
        if(!user) return res.send('User not found');

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch) return res.send('Invalid password');

        const role=user.profile.role;
        const token=jwt.sign(
            { id: user.id,role},
            'secretkey',
            {expiresIn: '1h'}
        );
        res.cookie('token',token);
        res.redirect('/profile');
    }
);


router.post('/register',
    [body('email').isEmail(),
        body('password').isLength({min:6})
    ],
    async(req,res)=>{
        const errors =validationResult(req);
        if(!errors.isEmpty()){
            return res.json(errors);
        }
        const {email,password}=req.body;

        const existing = await User.findOne({where:{email}});
        if(existing) return res.send('User already exists');

        const hash = await bcrypt.hash(password,10);

        await User.create({
            email,
            password:hash,
            profile:{role:'user'}
        });
        res.redirect('/');
    }
);

router.get('/profile', auth(), async (req, res) => {
  const users = await User.findAll();

  res.render('profile', {
    user: req.user,
    users
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');   
  res.redirect('/');
});

module.exports=router;