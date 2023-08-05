const express = require('express');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 3001;
const db= require('./config/db')
const userRoutes = require('./routes/userRoutes')
const adminRoute = require('./routes/adminRoutes')

const bodyParser = require('body-parser')


//middleware

app.use(express.json())
app.use(bodyParser.urlencoded({ extended : true}))

app.get('/', (req, res) => {
  res.send('Hello');
});


//Router configuration   
app.use('/api', userRoutes );
app.use('/api', adminRoute)

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

