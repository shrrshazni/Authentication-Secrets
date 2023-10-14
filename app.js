//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const encrypt = require("mongoose-encryption");

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

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});

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
    if (checkUser.password == password) {
      console.log("Login succesful");
      res.render("secrets");
    }
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
  const newUser = new User({
    name: req.body.username,
    password: req.body.password,
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

//secrets

app.get("/secrets", function (req, res) {
  res.render("secrets");
});

//check server

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
