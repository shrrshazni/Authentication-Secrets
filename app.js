//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { render } = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const bcrypt = require("bcrypt");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");

// const saltRounds = 10;

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//init session
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

//init passport
app.use(passport.initialize());
app.use(passport.session());

//init mongoose
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/startupDB");
}

//init mongoose items

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  googleId: String,
});

//mongoose encryption

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

//mongoose passport-local
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//mongoose model
const User = new mongoose.model("User", userSchema);

//simplified passport-local-mongoose
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  const user = User.findById(id);
  if (!user) {
    done(null, false);
  } else {
    done(null, user);
  }
});

//init paspport auth google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      scope: ["profile"],
      state: true,
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

//home

app.get("/", function (req, res) {
  res.render("home");
});

//auth google

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

//login

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  const user = new User({
    username: username,
    password: password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });

  //passport local mongoose

  //bcrypt

  //   if (checkUser) {
  //     bcrypt.compare(password, checkUser.password, function (err, result) {
  //       if (result === true) {
  //         console.log("Login successful");
  //         res.render("secrets");
  //       }
  //     });
  //   } else {
  //     console.log("Login failed");
  //     res.redirect("/login");
  //   }
});

//register

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  //pasport local mongoose

  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );

  //bcrypt
  //   bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //     const newUser = new User({
  //       name: req.body.username,
  //       password: hash,
  //     });
  //     const checkResult = newUser.save();
  //     if (!checkResult) {
  //       console.log("Register failed.");
  //       res.redirect("/register");
  //     } else {
  //       console.log("Register successful");
  //       res.redirect("/secrets");
  //     }
  //   });
});

//secrets

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

//logout

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

//check server

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
