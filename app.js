
const express = require("express");
const bodyParser = require("body-parser");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook");
require("dotenv").config();



const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "secret key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://lakshittiwari22:Lucky%40123@cluster0.c7xc0mt.mongodb.net/userDB");


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String,
    googleId: String,
    facebookId: String 
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



const User = mongoose.model("User",userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
 
passport.deserializeUser(function(user, done) {
    done(null, user);
});

//google oauth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    //install mongoose-findorcreate, require it and add as a plugin to user schema to make this work/////
    User.findOrCreate({ googleId: profile.id }, function (err, user) { 
      return cb(err, user);
    });
  }
));

//passport-Oauth
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req, res)=>{
    res.render("home");
});
//google auth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

//google redirect////////
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

//facebook auth
app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login",(req, res)=>{
    res.render("login");
});
app.get("/register",(req, res)=>{
    res.render("register");
});



app.get("/secrets",function(req, res){
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // }else{
    //     res.redirect("/login");
    // }
    User.find({"secret":{$ne: null}})
    .then(foundUsers =>{
        if(foundUsers){
            res.render("secrets",{usersWithSecrets: foundUsers});
        }else{
            console.log("erroe");
        }
    }).catch(err =>{
        console.log(err);
    });
});

app.get("/submit",function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    console.log(req.user._id);
    User.findById(req.user._id)
    .then(foundUser =>{
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save()
            .then(result =>{
                res.redirect("/secrets");
            });
        }else{
            console.log("error!");
        };
    }).catch(err =>{
        console.log(err);
    })
});

app.get("/logout",function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});


app.post("/register",(req,res)=>{

 User.register({username: req.body.username},req.body.password, function(err, user){
    if(err){
        console.log(err);
        res.redirect("/register");
    }else{
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        });
    }
 })

    
});

app.post("/login",  (req,res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user,function(err){
    if(err){
        console.log(err);
    }else{

        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        });
    }
  })
})







app.listen(3000,()=>{
    console.log("Server startes at port 3000.");
});
