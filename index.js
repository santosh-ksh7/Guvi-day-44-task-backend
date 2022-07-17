import express from 'express';
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
import cors from "cors";
import nodemailer from "nodemailer";


const app = express();


app.use(express.json());


app.use(cors());


dotenv.config();


// const mongo_url = "mongodb://127.0.0.1";
const mongo_url = process.env.mongo_url


async function createConnection(){
    const client = new MongoClient(mongo_url);
    await client.connect();
    console.log("Mongo DB is connected");
    return client
}


const client = await createConnection();


app.get('/', function (req, res) {
  res.send('Hello, Welcome to the Application')
})


// This API is used to verify if the email exists in DB if yes it sends a mail with link to reset & random string generated
app.post('/reset', async function (req, res){
    const data_from_frontend = req.body;
    const find_in_db = await client.db("day-44-task").collection("users").findOne(data_from_frontend);
    if(find_in_db){
        let random_string = "";
        const buffer = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        let i=0;
        while(i<20){
            random_string+= buffer.charAt(Math.floor((Math.random()*(buffer.length))));
            i++;
        }
        await client.db("day-44-task").collection("users").updateOne(data_from_frontend, {$set :{random_string: random_string}});

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'dummyuser123890@gmail.com',
              pass: process.env.senderpass
            }
          });
          
          var mailOptions = {
            from: 'dummyuser123890@gmail.com',
            to: 'dummyuser12347890@gmail.com',
            subject: 'Sent Email using Node.js',
            text: `Copy this string : ${random_string}
                    Open the link : https://clever-malabi-a145d2.netlify.app/reset1
            `        
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        res.send({"msg": "An email is sent to you. Kindly check your mails"});
    }else{
        res.send({"msg": "No such user exist"})
    }
    // find_in_db ? res.send({"msg": "Email exist"}) : res.send({"msg": "Email doesn't exist"});
})


// This API matches whether the random string in mail matches the random string in DB
app.post('/reset1', async function (req, res){
    const data_from_frontend = req.body;
    const find_in_db = await client.db("day-44-task").collection("users").findOne(data_from_frontend);
    if(find_in_db){
        res.send({"msg": "Random string matched", "email": find_in_db.email})
    }else{
        res.send({"msg": "Random string doen't match. Please enter the random string correctly"})
    }
})



// This API resets  the password in DB
app.post('/reset2', async function (req, res){
    const data_from_frontend = req.body;
    if(data_from_frontend.password1===data_from_frontend.password2){
        let result11 = await client.db("day-44-task").collection("users").updateOne({random_string: data_from_frontend.random_string}, {$set: {"password" : data_from_frontend.password1}});
        res.send({"msg": "Password succesfully updated. Go to login-page & log back in with new password"}) 
    }else{
        res.send({"msg": "Both the passwords do not match"})
    }
})



// This API will be used to register new user
app.post('/register', async function (req, res){
    const data_from_frontend = req.body;

    const check_before_inserting = await client.db("day-44-task").collection("users").findOne({email : data_from_frontend.email});

    if(check_before_inserting){
        res.send({"msg": "Email already exists. Try creating one with a different email"})
    }else{
        const result = await client.db("day-44-task").collection("users").insertOne(data_from_frontend);
        result.acknowledged ? res.send({"msg": "User added succesfully"}) : res.send({"msg": "Operation wasn't succesfull"})
    }
    
})


// This API handles the login process
app.post('/login', async function (req, res){
    const data_from_frontend = req.body;

    const check_before_login = await client.db("day-44-task").collection("users").findOne({email : data_from_frontend.email});

    

    if(check_before_login  && check_before_login.password===data_from_frontend.password){
        res.send({"msg": "Succesfully logged in"})
    }else{
        res.send({"msg": "Invalid credentials"})
    }
})


app.listen(process.env.PORT);