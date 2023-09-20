const express = require('express');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 3001;
const db= require('./config/db')
const userRoutes = require('./routes/userRoutes')
const adminRoute = require('./routes/adminRoutes')
const cors = require('cors')
const multer = require('multer')
const path =require('path')
const bodyParser = require('body-parser')


const { sendUpcomingNotifications } = require('./controller/adminController');
const cron = require('node-cron');

// Schedule the job to run every hour
cron.schedule('0 * * * *', () => {
  sendUpcomingNotifications();
});



//middleware

app.use(express.json())
app.use(bodyParser.urlencoded({ extended : true}))
app.use(cors())
app.use( express.static('uploads'));


app.get('/', (req, res) => {
 res.sendFile(__dirname +'/booking.html')
});

//Router configuration   
app.use('/api', userRoutes );
app.use('/api', adminRoute)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://192.168.1.51:3000/api/'); 
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});



app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

