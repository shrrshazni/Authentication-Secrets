//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { render } = require("ejs");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");

const saltRounds = 10;

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/startupDB");
}

//init mongoose items

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
});

//mongoose encryption

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User = new mongoose.model("User", userSchema);

//home

app.get("/", function (req, res) {
  res.render("home");
});

//login

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  const checkUser = await User.findOne({ name: username });

  if (checkUser) {
    bcrypt.compare(password, checkUser.password, function (err, result) {
      if (result === true) {
        console.log("Login successful");
        res.render("secrets");
      }
    });
  } else {
    console.log("Login failed");
    res.redirect("/login");
  }
});

//register

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new User({
      name: req.body.username,
      password: hash,
    });

    const checkResult = newUser.save();

    if (!checkResult) {
      console.log("Register failed.");
      res.redirect("/register");
    } else {
      console.log("Register successful");
      res.redirect("/secrets");
    }
  });
});

//secrets

app.get("/secrets", function (req, res) {
  res.render("secrets");
});

//check server

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
