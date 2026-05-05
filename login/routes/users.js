const express = require('express');
const router = express.Router();
const User = require('../models/user');

// CREATE
router.post('/users', async (req, res) => {
  await User.create({
    email: req.body.email,
    password: req.body.password,
    profile: { role: req.body.role }
  });

  res.redirect('/profile');
});

// UPDATE
router.put('/users/:id',  async (req, res) => {
  try {
    console.log("UPDATE", req.params.id);

    await User.update(
      {
        email: req.body.email,
        profile: { role: req.body.role }
      },
      { where: { id: req.params.id } }
    );

    res.redirect('/profile');

  } catch (err) {
    console.log(err);
    res.send("Update failed");
  }
});

// DELETE
router.delete('/users/:id', async (req, res) => {
  try {
    console.log("DELETE user", req.params.id);

    await User.destroy({
      where: { id: req.params.id }
    });

    res.redirect('/profile');

  } catch (err) {
    console.log(err);
    res.send("Delete failed");
  }
});
module.exports = router;