require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const User = require('./models/user');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

const PORT = 3006;
//const PORT = process.env.PORT || 3006; process.env.PORT -> gets port from environment

const app = express();

//using ui(browser) better to store token in cookies

const cookieParser=require('cookie-parser');
app.use(cookieParser());

app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use('/', authRoutes);
app.use('/', userRoutes);
app.get('/', (req, res) => {
  res.render('login',{
    error:req.query.error,
    success: req.query.success
  });
});
app.get('/login', (req, res) => {
  res.render('login', {
    error: req.query.error,
    success: req.query.success
  });
});
app.get('/register',(req,res)=>{
  res.render('register');
});
async function start() {
  await sequelize.sync({alter:true});
  const hash = await bcrypt.hash('123456', 10);

  await User.findOrCreate({
    where: { email: 'admin@test.com' },
    defaults: {
      password: hash,
      profile: { role: 'admin' }
    }
  });

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}

start();