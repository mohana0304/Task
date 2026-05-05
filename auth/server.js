require('dotenv').config();
const express = require('express');
const jwt= require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app=express();
app.use(express.json());

const users=[];

app.post('/register',async(req,res)=>{
    const {username,email,password}=req.body;

    const existingUser = users.find(u=>u.email === email);
    if(existingUser){
        return res.status(400).json({message:"Email already registered"});
    }
    const hashedpassword = await bcrypt.hash(password,10);

    const newUser={
        id:users.length+1,
        username,
        email,
        password:hashedpassword
    }
    users.push(newUser);
    res.json({message: "User registered successfully"});
});

console.log("JWT_SECRET:", process.env.JWT_SECRET);
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  console.log("TOKEN:", token);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED:", decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.log("ERROR:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    res.status(403).json({ message: "Invalid token" });
  }
}
app.get('/profile', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);

  res.json({
    id: user.id,
    username: user.username,
    email: user.email
  });
});

app.listen(3002, () => {
  console.log("Server running on port 3002");
});