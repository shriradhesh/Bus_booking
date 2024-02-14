const express = require('express');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 4001;
const db= require('./config/db')
const userRoutes = require('./routes/userRoutes')
const adminRoute = require('./routes/adminRoutes')

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
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');



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


// MTN momo 
async function getApiKey(xReferenceId, subscriptionKey) {
  try {
      const apiKeyResponse = await axios.post(
          `https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${xReferenceId}/apikey`,
          null,
          {
              headers: {
                  'Ocp-Apim-Subscription-Key': subscriptionKey,
              },
          }
      );

      // Assuming the API key is directly under data, modify this line accordingly
      return apiKeyResponse.data;
  } catch (error) {
      throw error;
  }
}

// Function to create access token for a given API
async function createAccessToken(url, subscriptionKey, xReferenceId, username, password) {
  try {
      const tokenResponse = await axios.post(
          url,
          null,
          {
              auth: {
                  username: username,
                  password: password.apiKey,
              },
              headers: {
                  'Ocp-Apim-Subscription-Key': subscriptionKey,
                  'Content-Type': 'application/json',
              },
          }
      );

      return tokenResponse.data.access_token;
  } catch (error) {
      console.error('Error creating access token:', error.response ? error.response.data : error.message);
      console.error('Request details:', error.config);
      throw error;
  }
}

app.post('/createApiUser', async (req, res) => {
  try {
      // Set credentials and create API user
      const xReferenceId = uuidv4(); // Generate a unique xReferenceId
      const { subscriptionKey, XCallbackUrl } = req.body;

      // Step 1: Create API user
      const apiUserResponse = await axios.post(
          'https://sandbox.momodeveloper.mtn.com/v1_0/apiuser',
          {
              providerCallbackHost: 'http://13.51.77.134/',
          },
          {
              headers: {
                  'X-Reference-Id': xReferenceId,
                  'Ocp-Apim-Subscription-Key': subscriptionKey,
                  'Content-Type': 'application/json',
              },
          }
      );

      // Assuming the API key URL is available in the response, modify this line accordingly
      // const apiKeyUrl = apiUserResponse.data.apiKeyUrl;

      // Step 2: Retrieve API key for the first API
      const apiKey1 = await getApiKey(xReferenceId, subscriptionKey);
      console.log(apiKey1);
      // Step 3: Create access token for the first API
      // Assuming you have the username and password for MTN MoMo
      const momoUsername = xReferenceId;
      const momoPassword = apiKey1;

      // ... (other code)

      // Step 3: Create access token for the first API
      const tokenUrl1 = 'https://sandbox.momodeveloper.mtn.com/collection/token/';
      const bearerToken1 = await createAccessToken(tokenUrl1, subscriptionKey, xReferenceId, momoUsername, momoPassword);
       console.log(bearerToken1);
      // ... (other code)

      // Repeat steps 2 and 3 for the second API (customize the URLs accordingly)
      // Step 2: Retrieve API key for the second API
      const apiKey2 = await getApiKey(xReferenceId, subscriptionKey);
     
      const momoUsername1 = xReferenceId;
      const momoPassword2 = apiKey2;


      // Step 3: Create access token for the second API
      const tokenUrl2 = 'https://sandbox.momodeveloper.mtn.com/collection/token/';
      const bearerToken2 = await createAccessToken(tokenUrl2, subscriptionKey, xReferenceId, momoUsername1, momoPassword2);

      res.status(200).send({ 
          success:true,
          message : 'user created successfully', 
          apiKey1, bearerToken1, apiKey2, bearerToken2, xReferenceId 
      });
  } catch (error) {
      console.error('Error creating API user:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

  /*
app.post('/makePayment', async (req, res) => {
  try {
      // Make payment request
      const { xReferenceId, subscriptionKey, XCallbackUrl, apiKey, bearerToken } = req.body;
      const { amount, phone, referenceNumber } = req.body;

      const paymentRequestResponse = await axios.post(
          'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
          {
              amount,
              currency: 'EUR',
              externalId: referenceNumber,
              payer: {
                  partyIdType: 'MSISDN',
                  partyId: phone,
              },
              payerMessage: 'Paying For Bus Ticket',
              payeeNote: 'Payment Successful',
          },
          {
              headers: {
                  'X-Reference-Id': xReferenceId,
                  'X-Target-Environment': 'sandbox',
                  'Content-Type': 'application/json',
                  'Ocp-Apim-Subscription-Key': subscriptionKey,
                //  'X-Callback-Url': XCallbackUrl,
                  'Authorization': `Bearer ${bearerToken}`,
              },
          }
      );
      console.log('Payment Request Response:', {
          message: 'Payment Successful',
          paymentResponse: paymentRequestResponse?.data, // Exclude circular references
      });
      res.status(200).send({
          success: true,
          message: 'Payment Successful', 
          paymentResponse: paymentRequestResponse.data
      })
      //res.json({ message: 'Payment Successful', paymentResponse: paymentRequestResponse.data });
      //  res.json({ message: 'Payment Successful', paymentResponse: paymentRequestResponse }).data 
  } catch (error) {
      console.error('Error making payment request:', error.response ? error.response.data : error.message);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
  
});

app.get('/paymentStatus', async (req, res) => {
  try {
      // Get payment status
      const { xReferenceId, subscriptionKey, bearerToken } = req.body;

      const paymentStatusResponse = await axios.get(
          `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${xReferenceId}`,
          {
              headers: {
                  'X-Target-Environment': 'sandbox',
                  'Ocp-Apim-Subscription-Key': subscriptionKey,
                  'Authorization': `Bearer ${bearerToken}`,
              },
          }
      );
      res.status(200).send({
          success: true, 
          paymentStatus: paymentStatusResponse.data
      })
     // res.json({  success: true, paymentStatus: paymentStatusResponse.data });
  } catch (error) {
      console.error('Error getting payment status:', error.message);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

 */

app.post('/makePayment', async (req, res) => {
    try {
        // Make payment request
        const { xReferenceId, subscriptionKey, XCallbackUrl, apiKey, bearerToken } = req.body;
        const { amount, phone, referenceNumber } = req.body;

        const paymentRequestResponse = await axios.post(
            'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
            {
                amount,
                currency: 'EUR',
                externalId: referenceNumber,
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: phone,
                },
                payerMessage: 'Paying For Bus Ticket',
                payeeNote: 'Payment Successful',
            },
            {
                headers: {
                    'X-Reference-Id': xReferenceId,
                    'X-Target-Environment': 'sandbox',
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Authorization': `Bearer ${bearerToken}`,
                },
            }
        );

        console.log('Payment Request Response:', {
            message: 'Payment Successful',
            paymentResponse: paymentRequestResponse?.data, // Exclude circular references
        });

        // Get payment status
        const paymentStatusResponse = await axios.get(
            `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${xReferenceId}`,
            {
                headers: {
                    'X-Target-Environment': 'sandbox',
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Authorization': `Bearer ${bearerToken}`,
                },
            }
        );

        console.log('Payment Status Response:', {
            message: 'Payment Status Successful',
            paymentStatus: paymentStatusResponse.data,
        });

        res.status(200).send({
            success: true,
            message: 'Payment and Payment Status Successful',
            paymentResponse: paymentRequestResponse.data,
            paymentStatus: paymentStatusResponse.data,
            xReferenceId : xReferenceId
        });
    } catch (error) {
        console.error('Error making payment request or getting payment status:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


//Router configuration   
app.use('/api', userRoutes );
app.use('/api', adminRoute);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://13.51.77.134/'); 
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});



app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

