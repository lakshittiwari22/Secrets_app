//jshint esversion:6
// require('dotenv').config();
// const md5 = require('md5');
const bcrypt = require("bcrypt");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://127.0.0.1:27017/userDB");
const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const saltRounds = 10;


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// const secret = process.env.SECRET ///////using this command we are calling the encryption key from .env fileno/////////

// userSchema.plugin(encrypt, { secret: secret,encryptedFields: ['password'] });

const User = mongoose.model("User",userSchema);

app.get("/",(req, res)=>{
    res.render("home");
});
app.get("/login",(req, res)=>{
    res.render("login");
});
app.get("/register",(req, res)=>{
    res.render("register");
});


app.post("/register",(req,res)=>{

    bcrypt.hash(req.body.password,saltRounds,function(err, hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
    
        newUser.save()
        .then(result =>{
            if(result){
                res.render("secrets");
            }else{
                console.log("Something went wrong!")
            }
        });
    });

    
});

app.post("/login",  (req,res)=>{
    const loginPassword = req.body.password;
   

   

    User.findOne({email: req.body.username,})
    .then(foundUser => {

        bcrypt.compare(loginPassword, foundUser.password, function(err, result) {
            if(result === true){
        
                res.render('secrets');
            }else{
                console.log("username or password incorrect!");
            }
        });

       

    }).catch(err => {
        console.log(err);
    })

    
    

   
    
})







app.listen(3000,()=>{
    console.log("Server startes at port 3000.");
});