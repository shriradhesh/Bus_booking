const express = require('express');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 4001;
const db= require('./config/db')
const userRoutes = require('./routes/userRoutes')
const adminRoute = require('./routes/adminRoutes')
const socialRoutes = require('./routes/socialRoutes')
const cors = require('cors')
const multer = require('multer')
const path =require('path')
const bodyParser = require('body-parser')
const passport = require('passport')
const session = require('express-session')
const bcrypt = require('bcrypt')
const GoogleStrategy = require('passport-google-oauth2').Strategy
const Admin = require('./models/adminModel')

const { sendUpcomingNotifications } = require('./controller/adminController');
const cron = require('node-cron');
const { refreshToken } = require('firebase-admin/app');
const { profile } = require('console');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const cookieSession = require('cookie-session')
require('./utils/passport-setup')



passport.serializeUser((user, done) => {
  done(null, user._id); 
});


passport.deserializeUser((id, done) => {
  Admin.findById(id)
    .then((existingAdmin) => {
      done(null, existingAdmin);
    })
    .catch((err) => {
      done(err);
    });
});



         
      
//middleware

app.use(express.json())
app.use(bodyParser.urlencoded({ extended : true}))
app.use(cors())
app.use( express.static('uploads'));
   // session for google
app.use(
     session({
            secret : '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',
            resave : false ,
            saveUninitialized : true,
     })
)
// session for facebook
app.use(
     session({
            secret : 'cd52c6c56378a9613d0d2033746bc9c4',
            resave : false ,
            saveUninitialized : true,
     })
)
// session for linkedIn
app.use(
     session({
            secret : 'Ni4dGLnkErHU2ddG',
            resave : false ,
            saveUninitialized : true,
     })
)
// session for twitter
app.use(
     session({
            secret : 'o2XkZujeCymir1382obJA4rVSGtQG6BopGYBf3UUm7BYennXFt',
            resave : false ,
            saveUninitialized : true,
     })
)

app.use(passport.initialize())
app.use(passport.session())




app.get('/', (req, res) => {
 res.sendFile(__dirname +'/booking.html')
});
app.get('/api/import_Buses', (req, res) => {
 res.sendFile(__dirname +'/import_Buses.html')
});

app.get('/admin', (req, res) => {
  
  res.send('Welcome to the admin dashboard!');
});
app.get('/login', (req, res) => {
  
  res.send('login again');
});


//Router configuration   
app.use('/api', userRoutes );
app.use('/api', adminRoute);
app.use('/auth' , socialRoutes);
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://13.51.77.134/'); 
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});



app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

