const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { auth } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const { format } = require('sequelize/lib/utils');

// CREATE
router.post('/users',auth(),
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({min: 6}).withMessage('password too short'),
    body('role').notEmpty().withMessage('Role required')
  ],async (req, res) => {
  try{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
     const msg= errors.array()[0].msg;
     const users = await User.findAll();
     return res.render('profile',{
      user:req.user,
      users,
      error:msg,
      success:null,
      formData:req.body
     });
    }

    const {email,password,role} = req.body;
    const hashedPassword = await bcrypt.hash(password,10);

    await User.create({
    email,
    password:hashedPassword,
    profile: { role}
  });
  res.redirect('/profile?success=User created');
  }catch(err){
    console.log(err);
    res.redirect('/profile?error=' + encodeURIComponent(err.message));
  }
  
});

// UPDATE
router.put('/users/:id',auth(['admin']),
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').optional({ checkFalsy: true }).isLength({min: 6}).withMessage('password too short'),
    body('role').notEmpty().withMessage('Role required')
  ],  async (req, res) => {
  try {

    const errors= validationResult(req);

    if(!errors.isEmpty()){
              const msg = errors.array()[0].msg;
        const users = await User.findAll();

        return res.render('profile', {
          user: req.user,
          users,
          error: msg,
          success: null,
        });
    }

    const{id} = req.params;
    const {email,password,role}=req.body;

    const updateData ={};
    if(email) updateData.email = email;
    if(role) updateData.profile={role};

    if(password && password.trim()!==''){
      const hashedPassword = await bcrypt.hash(password,10);
      updateData.password=hashedPassword;
    }

    const [updated] = await User.update(
      updateData,{
      where: { id } 
    });

    if(!updated){
        return res.render('profile', {
          user: req.user,
          users: await User.findAll(),
          error: 'User not found',
          success: null,
        });
    }

    res.redirect('/profile?success=User updated');

  } catch (err) {
    console.log(err);
    res.redirect('/profile?error=' + encodeURIComponent(err.message));
  }
});

// DELETE
router.delete('/users/:id',auth(['admin']), async (req, res) => {
  try {
    const {id} = req.params;

    await User.destroy({
      where: { id}
    });

    res.redirect('/profile?success=User deleted');

  } catch (err) {
    console.log(err);
    res.redirect('/profile?error=' + encodeURIComponent(err.message));
  }
});
module.exports = router;
