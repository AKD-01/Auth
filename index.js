const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require("mongoose");
const app = express();

const userModel = require('./models/user');
const user = require("./models/user");
const mongoURI = "mongodb://0.0.0.0:27017/sessions";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("MongoDB Connected");
  });

const store = new MongoDBSession({
  uri: mongoURI,
  collection: "mySessions",
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const isAuth = (req, res, next) => {
  if(req.session.isAuth) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get("/", (req, res) => {
  res.render("landing");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async(req, res) => {
  const { email, password } = req.body;
  const User = await userModel.findOne({email});
  if(!User) {
    return res.redirect('/login');
  }
  const isMatch = await bcrypt.compare(password, User.password);
  if(!isMatch) {
    return res.redirect("/login");
  }
  req.session.isAuth = true;
  res.redirect("/dashboard");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  let user_ = await userModel.findOne({email});
  if(user_) {
    return res.redirect('/register');
  }
  const hashedPsw = await bcrypt.hash(password, 12);
  user_ = new userModel({
    username,
    email,
    password: hashedPsw
  });
  await user_.save();
  res.redirect("/login");
});

app.get("/dashboard", isAuth, (req, res) => {
  res.render("dashboard");
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if(err) throw err;
    res.redirect("/");
  });
});

app.listen(5000, () => {
  console.log("App listening on port 5000!");
});

