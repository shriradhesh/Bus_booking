const express = require('express');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 4001;
const db = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const adminRoute = require('./routes/adminRoutes')
const busRoute = require('./routes/busRoutes')
const busrouteRoute = require('./routes/bus_routeRoutes')
const driverRoute = require('./routes/driverRoutes')
const tripRoute = require('./routes/tripRoutes')
const bookRoute = require('./routes/bookingRoutes')
const import_exportRoute = require('./routes/import_exportRoutes')
const notificationRoute = require('./routes/notificationRoutes')
const transactionRoute = require('./routes/transactionRoutes')


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
const moment = require('moment')
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');



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



  
//    // session for google
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
app.use('/api', busRoute);
app.use('/api', busrouteRoute);
app.use('/api', driverRoute);
app.use('/api', tripRoute);
app.use('/api', bookRoute);
app.use('/api', import_exportRoute);
app.use('/api', notificationRoute);
app.use('/api', transactionRoute);


//http://13.51.77.134/
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});



                                                                // MTN momo 
   
   // API endpoint for obtaining access token
   app.post('/api/get_access_token', async (req, res) => {
    try {
        /// Step 1: Obtain Access Token
        const username = "4odjqrt1fsiid325g1qus89fqg";
        const password = "1o708q03dikovh1m8s4e864uiia7nvhmtroll2qt6662hlpigah3";
        const grantType = "client_credentials";

        // Generate a unique identifier (timestamp in milliseconds)
        const uniqueIdentifier = Date.now().toString();

        const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');

        // Send a request to get the access token
        const authResponse = await axios.post(
            'https://omapi-token.ynote.africa/oauth2/token',
            new URLSearchParams({
                grant_type: grantType,
                unique_identifier: uniqueIdentifier
            }).toString(),
            {
                headers: {
                    'Authorization': `Basic ${base64Credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );       

        // Return response to client
        res.status(200).json({
            success: true,
            access_token: authResponse.data.access_token
        });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

                                                   

                    app.post('/api/mtn_payment', async (req, res) => {
                        try {
                            
                            // Step 1: Obtain Access Token
                            const username = "4odjqrt1fsiid325g1qus89fqg";
                            const password = "1o708q03dikovh1m8s4e864uiia7nvhmtroll2qt6662hlpigah3";
                            const grantType = "client_credentials";
                    
                            // Generate a unique identifier (timestamp in milliseconds)
                            const uniqueIdentifier = Date.now().toString();
                    
                            const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
                    
                            // Send a request to get the access token
                            const authResponse = await axios.post(
                                'https://omapi-token.ynote.africa/oauth2/token',
                                new URLSearchParams({
                                    grant_type: grantType,
                                    unique_identifier: uniqueIdentifier
                                }).toString(),
                                {
                                    headers: {
                                        'Authorization': `Basic ${base64Credentials}`,
                                        'Content-Type': 'application/x-www-form-urlencoded'
                                    }
                                }
                            );
                    
                            // Extract the access token from the response
                            const accessToken = authResponse.data.access_token;
                    
                            // Retrieve parameters from the request body
                            var { amount , subscriberMsisdn } = req.body;
                    
                          

                            // Generate a random 9-digit orderId
                             const orderId = generateOrderId();
                             
                            const requestData = {
                                API_MUT: {
                                    notifUrl : 'https://webhook.site/zeufitech' ,
                                    amount: amount,
                                    subscriberMsisdn: subscriberMsisdn,
                                    order_id: orderId,
                                    description: "mtn payment for Bus Booking",
                                    customersecret: "2cc76aa531e52d0f0de0efc41a06931b048acd26e92c9f0aadb10ed87404aa7b",
                                    customerkey: "3be24d06-ab8f-5714-931a-f5b96f1fc1a3",
                                    PaiementMethod: "MTN_CMR"
                                }
                            };
                    
                            // Configure the request for MTN web payment
                            const paymentConfig = {
                                method: 'post',
                                url: 'https://omapi.ynote.africa/prod/webpayment',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${accessToken}`
                                },
                                data: requestData,
                                timeout: 10000

                            };
                    
                            // Make the request for MTN web payment using Axios
                            const paymentResponse = await axios.request(paymentConfig);
                    
                            // Construct the response data
                            const responseData = {
                                success: true,
                                access_token: accessToken,
                                order_id: orderId,
                                payment_data: paymentResponse.data
                            };
                    
                            // Send the response
                            res.status(200).json(responseData);
                        } catch (error) {
                            // Handle errors
                            res.status(500).json({
                                success: false,
                                message : 'MTN payment error',
                                error: error.message
                            });
                        }
                    });


                    function generateOrderId() {
                        let orderId = '';
                        for (let i = 0; i < 8; i++) {
                            const digit = Math.floor(Math.random() * 3) + 1;
                            orderId += digit;
                        }
                        return orderId;
                    }
                    
                            
                   
// step 3 ----> check payment status

app.post('/api/mtn_checkPaymentStatus', async (req, res) => {
    try {
        // Retrieve parameters from the request body
        const { message_id, access_token } = req.body;

        // Prepare the request data
        let data = JSON.stringify({
            "message_id": message_id,
            "customerkey": "3be24d06-ab8f-5714-931a-f5b96f1fc1a3",
            "customersecret": "2cc76aa531e52d0f0de0efc41a06931b048acd26e92c9f0aadb10ed87404aa7b"
        });

        // Configure the request
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://omapi.ynote.africa/prod/webpaymentmtn/status',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            data: data
        };

        // Make the request using Axios
        const response = await axios.request(config);

        // Construct the response data
        const responseData = {
            success: true,
            paymentStatus: response.data
        };

        // Send the response
        res.status(200).json(responseData);
    } catch (error) {
        // Handle errors
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking payment status',
            error: error.message
        });
    }
});

                                                                    /* Orange Payment  */
     

   
       

    // Endpoint to obtain access token and initiate payment request
    app.post('/api/initiatePayment', async (req, res) => {
        try {
            // Step 1: Obtain Access Token
            const username = "X_kT8gdEALMotiuTXUW4FMt7CcAa";
            const password = "T3hIFfJSjMJwwk2HZweo5xx2hzUa";
            const grantType = "client_credentials";
            
            // Generate a unique identifier (timestamp in milliseconds)
            const uniqueIdentifier = Date.now().toString();
        
            const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
        
            const authResponse = await axios.post(
                'https://api-s1.orange.cm/token',
                new URLSearchParams({
                    grant_type: grantType,
                    unique_identifier: uniqueIdentifier
                }).toString(),
                {
                    headers: {
                        'Authorization': `Basic ${base64Credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            const accessToken = authResponse.data.access_token;
    
            // Step 2: Use Access Token to Initiate Payment
            const paymentResponse = await axios.post(
                'https://api-s1.orange.cm/omcoreapis/1.0.2/mp/init',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`, // Corrected the authorization header
                        'Content-Type': 'application/json',
                        'X-AUTH-TOKEN': 'WU5PVEVIRUFEOllOT1RFSEVBRDIwMjA='
                    }
                }
            );
    
            const payToken = paymentResponse.data.data.payToken;
    
            // Construct the response
            const responseData = {
                success: true,
                message: "Payment request successfully initiated",
                data: {
                    access_token: accessToken,
                    payToken: payToken
                }
            };
    
            // Send the response
            res.status(200).json(responseData);
        } catch (error) {
            // Handle errors
            res.status(500).json({
                success: false,
                message: 'An error occurred during payment initiation',
                error: error.message
            });
        }
    });


    
    

// APi for orange payment
                
                 // step 3
                 app.post('/api/pay', async (req, res) => {
                    try {
                        // Access token obtained from the request body
                        const access_token = req.body.access_token;
                
                        // Retrieve parameters from the request body
                        const { amount, subscriberMsisdn, payToken } = req.body;
                
                        // Construct the request data with fixed values and generated orderId
                        const orderId = `order${Math.random().toString(36).substring(2)}`;
                        const data = JSON.stringify({
                            "notifUrl": "https://webhook.site/zeufitech",
                            "channelUserMsisdn": "659924755",
                            "amount": amount,
                            "subscriberMsisdn": subscriberMsisdn,
                            "pin": "2369",
                            "orderId": orderId,
                            "description": "Commande 12345",
                            "payToken": payToken
                        });
                
                        // Configure the request
                        const config = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: 'https://api-s1.orange.cm/omcoreapis/1.0.2/mp/pay',
                            headers: { 
                                'X-AUTH-TOKEN': 'WU5PVEVIRUFEOllOT1RFSEVBRDIwMjA=', 
                                'Content-Type': 'application/json', 
                                'Authorization': `Bearer ${access_token}`
                            },
                            data: data , 
                            timeout : 10000
                        };
                
                        // Make the request using Axios
                        const response = await axios.request(config);
                
                        // Construct the response data
                        const responseData = {
                            success: true,                         
                            data: response.data
                        };
                
                        // Send the response
                        res.status(200).json(responseData);
                    } catch (error) {
                        // Handle errors
                        res.status(500).json({
                            success: false,
                            message : 'payment error',
                            error: error.message
                        });
                    }
                });
                
               
                
           // Api for check payment status
           
           app.post('/api/checkPaymentStatus', async (req, res) => {
            try {
                // Retrieve parameters from the request body
                const { access_token, payToken } = req.body;
        
                // Make the request to check payment status
                const config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `https://api-s1.orange.cm/omcoreapis/1.0.2/mp/paymentstatus/${payToken}`,
                    headers: { 
                        'X-AUTH-TOKEN': 'WU5PVEVIRUFEOllOT1RFSEVBRDIwMjA=', // Your X-AUTH-TOKEN
                        'Authorization': `Bearer ${access_token}`
                    }
                };
        
                const response = await axios.request(config);
        
                // Construct the response data
                const responseData = {
                    success: true,
                    paymentStatus: response.data
                };
        
                // Send the response
                res.status(200).json(responseData);
            } catch (error) {
                // Handle errors
                res.status(500).json({
                    success: false,
                    message: 'An error occurred while checking payment status',
                    error: error.message
                });
            }
        });

        



         
      




app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

