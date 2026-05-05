const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("./User");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ where: { username } });

      if (!user) return done(null, false, { message: "User not found" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Wrong password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id);
  done(null, user);
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await User.create({
    username,
    password: hash
  });

  res.send("User created");
});
app.post("/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login"
  })
);

function isAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.send("Not authorized");
}

app.get("/dashboard", isAuth, (req, res) => {
  res.send("Welcome " + req.user.username);
});