const express = require('express');
const router = express.Router();

const {
  user, profile, post, comment,
  student, course, enrollment
} = require('../models');

router.post('/users', async (req, res) => {
  const data = await user.create(req.body);
  res.json(data);
});

router.post('/profiles', async (req, res) => {
  const data = await profile.create(req.body);
  res.json(data);
});

router.post('/posts', async (req, res) => {
  const data = await post.create(req.body);
  res.json(data);
});

router.post('/comments', async (req, res) => {
  const data = await comment.create(req.body);
  res.json(data);
});
router.post('/students', async (req, res) => {
  const data = await student.create(req.body);
  res.json(data);
});

router.post('/courses', async (req, res) => {
  const data = await course.create(req.body);
  res.json(data);
});
router.post('/enrollments', async (req, res) => {
  const data = await enrollment.create(req.body);
  res.json(data);
});

router.get('/users',async(req,res)=>{
    const users=await user.findAll({
        include:post
    });
    res.json(users);
});
router.get('/profiles', async (req, res) => {
  const data = await profile.findAll();
  res.json(data);
});

router.get('/students', async (req, res) => {
  const data = await student.findAll();
  res.json(data);
});

router.get('/courses', async (req, res) => {
  const data = await course.findAll();
  res.json(data);
});

router.get('/comments', async (req, res) => {
  const data = await comment.findAll();
  res.json(data);
});

router.get('/enrollments', async (req, res) => {
  const data = await enrollment.findAll();
  res.json(data);
});

router.get('/users/:id', async (req, res) => {
  const user = await user.findByPk(req.params.id, {
    include: post
  });
  res.json(user);
});

router.put('/users/:id', async (req, res) => {
  await user.update(req.body, {
    where: { id: req.params.id }
  });
  res.json({ message: "User updated" });
});

router.delete('/users/:id', async (req, res) => {
  await User.destroy({
    where: { id: req.params.id }
  });
  res.json({ message: "User deleted" });
});


module.exports = router;