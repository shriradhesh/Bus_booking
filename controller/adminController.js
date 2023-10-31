const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Admin = require('../models/adminModel')
const changePass  = require('../models/changePassword')
const BookingModel = require('../models/BookingModel')
const UserModel = require('../models/userModel');
const BusModel = require('../models/busModel')
const stopModel = require('../models/stopModel')
const sendCancelEmail =require("../utils/sendCancelEmail")
const sendBookingEmail =require("../utils/sendBookingEmail")
const NotificationDetail = require('../models/notificationDetails')
const TransactionModel = require('../models/transactionModel')
const upload = require('../uploadImage')
const BusRoute = require('../models/bus_routes')
const DriverModel = require('../models/driverModel')
const passport = require('passport');
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const shortid = require('shortid')
const qrcode = require('qrcode')
const { error } = require('console')
const fs = require('fs');
const moment = require('moment');
const twilio = require('twilio')
const TripModel = require('../models/tripModel')
const cron = require('node-cron');
const axios = require('axios');
const ExcelJs = require('exceljs')
const FcmAdmin = require('firebase-admin');
const serviceAccount = require("../utils/bus-book-29765-firebase-adminsdk-eihc4-9e45efe148.json");
const _ = require('lodash')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { validationResult } = require('express-validator');




    
 // Initialize Firebase Admin SDK with credentials
 
 FcmAdmin.initializeApp({
   credential : FcmAdmin.credential.cert(serviceAccount)
 })


                      /* -->  ADMIN Api'S   <--    */

//admin login API                           // UserName : Admin , Password : A1bcd2@12
    
                const adminLogin = async (req, res) => {
                  try {
                      const { username, password } = req.body

                      // Find Admin by username
                      const admin = await Admin.findOne({ username });

                      if (!admin) {
                          return res.status(401).json({ message: 'Username incorrect', success: false });
                      }

                      // Compare passwords using bcrypt
                      const passwordMatch = await bcrypt.compare(password, admin.password);

                      if (passwordMatch) {
                          return res.json({ message: 'Admin Login Successful', success: true, data: admin });
                      } else {
                          return res.status(401).json({ message: 'Password incorrect', success: false });
                      }
                  } catch (error) {
                      console.error(error);
                      res.status(500).json({ message: 'Internal server error', success: false });
                  }
                };

  // API for google login
                    const googleLogin = async(req,res)=>{                      
                        try {
                          const { email } = req.body;
                      
                          // Find Admin by email
                          const admin = await Admin.findOne({ email });
                      
                          if (admin) {
                            
                            return res.json({ message: 'Admin Login Successful', success: true, data: admin });
                          } else {
                            return res.status(401).json({ message: 'Email not found', success: false });
                          }
                        } catch (error) {
                          console.error(error);
                          res.status(500).json({ message: 'Internal server error', success: false });
                        }
                      };
                       
                    
  
                           



  // APi for change  Login password 
        
            const changePassword = async (req, res)=>{
                try{
                     const id = req.params.id
                    const {  oldPassword , newPassword , confirmPassword} = req.body      
                   
                    const requiredFields = [
                      'oldPassword',
                      'newPassword',       
                      'confirmPassword',      
                     
                  ];
              
                  for (const field of requiredFields) {
                      if (!req.body[field]) {
                          return res.status(400).json({ message: `Missing ${field.replace('_', ' ')} field`, success: false });
                      }
                  }
                                
                      

                    // check for password match                     
                      
                      if( newPassword !== confirmPassword )
                      {
                        return res.status(400).json({ message : 'Password do not match' , success : false})
                      }

                       // find Admin by Id
                       
                       const admin = await Admin.findOne({_id:id})
                        
                       if(!admin){
                 
                        return res.status(404).json({ message : ' Admin not found' , success : false})
                       }
                       else
                       {
                                               
                         // check if old password match with stored password
                         
                         const isOldPasswordValid = await bcrypt.compare(oldPassword , admin.password)
                            if(!isOldPasswordValid)
                            {
                                return res.status(400).json({ message : 'Old Password incorrect ', success : false})
                            }
                      
                            // encrypt the newPassword 

                            const hashedNewPassword = await bcrypt.hash(newPassword ,10)
                            // update the admin password with new encrypted password 
                                    admin.password = hashedNewPassword
                                    await admin.save()
                                    return res.json({ message : ' Password changed Successfully', success : true})                                
                        } 
                    }
                    
                catch(error)
                {
                    console.error(error);
                    res.status(500).json({ message : 'Internal server error ', success : false})
                }
            }


                                             /* BUS MANAGEMENT */
        
// APi for add new bus
                  const addBus = async (req, res) => {
                      try {
                        const {
                          bus_type,
                          seating_capacity,        
                          bus_no,
                          model,
                          manufacture_year,
                          amenities,       
                          status, 
                        } = req.body;                     

                        const requiredFields = [
                          'bus_type',
                          'seating_capacity',       
                          'bus_no',            
                          'model',
                          'manufacture_year',
                          'amenities',        
                          'status',                          
                      ];

                      for (const field of requiredFields) {
                          if (!req.body[field]) {
                              return res.status(400).json({ message: `Missing ${field.replace('_', ' ')} field`, success: false });
                          }
                      }
                          
                        // Check for bus number
                        const existBus = await BusModel.findOne({ bus_no });
                    
                        if (existBus) {
                          return res.status(400).json({ message: 'Bus with the same Number is Already Exist', success: false });
                        }
                        
                      

                        const imagePath = req.files.map((file) => file.path);  
                          // check Bus status
                        const validStatuses = ['active', 'inactive'];
                        const busStatus = validStatuses.includes(status) ? status : 'active';
                            
                        const newBus = new BusModel({
                          bus_type: bus_type,
                          seating_capacity: seating_capacity,                          
                          bus_no: bus_no,
                          model: model,
                          manufacture_year: manufacture_year,
                          amenities: amenities,
                          images: imagePath,      
                          status: busStatus, 
                        });
                    
                        const savedBus = await newBus.save();
                        res.status(200).json({ success: true, message: 'Bus Added successfully', Bus: savedBus });
                      } catch (error) {
                        console.error('Error while adding the Bus', error);
                        res.status(500).json({ success: false, message: 'Error while adding the Bus', error: error });
                      }
                    };
  



  // Api for update bus with id
                        const updateBus = async (req, res) => {
                          try {
                              const id = req.params.id;
                              const {
                                  bus_type,
                                  seating_capacity,
                                  model,
                                  manufacture_year,
                                  amenities,
                                  status,
                                  availability
                              } = req.body;
                      
                              const existBus = await BusModel.findOne({ _id: id });
                              if (!existBus) {
                                  return res.status(400).json({ message: 'Bus Not found', success: false });
                              }
                      
                              const validStatus = ['active', 'inactive'];
                              const validAvailability = ['available', 'unavailable', 'booked'];
                      
                              if (!validStatus.includes(status)) {
                                  return res.status(400).json({ message: 'Invalid status value', success: false });
                              }
                      
                              if (!validAvailability.includes(availability)) {
                                  return res.status(400).json({ message: 'Invalid availability value', success: false });
                              }
                      
                              if (status === 'inactive' && availability !== 'unavailable') {
                                  return res.status(400).json({ message: 'Bus status can only be set to inactive when availability is unavailable', success: false });
                              }
                      
                              if (availability === 'unavailable' && status !== 'inactive') {
                                  return res.status(400).json({ message: 'Bus availability can only be set to unavailable when status is inactive', success: false });
                              }
                      
                              existBus.bus_type = bus_type;
                              existBus.seating_capacity = seating_capacity;
                              existBus.model = model;
                              existBus.manufacture_year = manufacture_year;
                              existBus.amenities = amenities;
                              existBus.status = status;
                              existBus.availability = availability;
                      
                              // Check if req.files exist and if it contains images
                              if (req.files && req.files.length > 0) {
                                  const images = [];
                                  for (const file of req.files) {
                                      // Ensure that the file is an image
                                      if (file.mimetype.startsWith('image/')) {
                                          if (existBus.images) {
                                              // If the Bus Images already exist, delete the old file if it exists
                                              const oldFilePath = `uploads/${existBus.images}`;
                                              if (fs.existsSync(oldFilePath)) {
                                                  fs.unlink(oldFilePath, (error) => {
                                                      if (error) {
                                                          console.error('Error deleting old file:', error);
                                                      }
                                                  });
                                              }
                                          }
                                          // Add the new image filename to the images array
                                          images.push(file.filename);
                                      }
                                  }
                                  // Update the profileImage with the new one(s) or create a new one if it doesn't exist
                                  existBus.images = images.length > 0 ? images : undefined;
                              }
                      
                              const updatedBus = await existBus.save();
                              res.status(200).json({ success: true, message: 'Bus Details Edited Successfully', updatedBus: updatedBus });
                          } catch (error) {
                              console.error(error);
                              res.status(500).json({ success: false, message: 'Error while editing the bus details' });
                          }
                      };
                      

  //APi for delete Bus 
               
                  const deleteBus = async (req, res) => {
                    try {
                        const busId = req.params.busId;
                        const bus = await BusModel.findById(busId);

                        if (!bus) {
                            return res.status(404).json({ success: false, message: 'Bus not found' });
                        }

                        if (bus.status === 'inactive' && bus.availability === 'unavailable') {
                            // Check if the bus is booked on other routes
                            const routesWithBus = await BusRoute.find({ busId: busId });
                            if (routesWithBus.length > 0) {
                                return res.status(400).json({ success: false, message: 'Bus is booked on other routes' });
                            }

                            // If not booked on other routes, delete the bus
                            await BusModel.deleteOne({ _id: busId });
                            res.status(200).json({ success: true, message: 'Bus deleted successfully' });
                        } else {
                            res.status(400).json({ success: false, message: 'Bus cannot be deleted , its currently status : active & Avaialabilty : available ' });
                        }
                    } catch (error) {
                        console.error(error);
                        res.status(500).json({success : false , message: 'Error while deleting the Bus' });
                    }
                };


//Api for Get All Buses with there status 
                const allBuses = async (req, res) => {
                  try {
                    const status = req.query.status;
                
                    let buses;
                    if (status === 'active') {
                      buses = await BusModel.find({ status: 'active', availability: { $in: ['available', 'booked'] } });
                    } else if (status === 'inactive') {
                      buses = await BusModel.find({ status: 'inactive', availability: 'unavailable' });
                    } else {
                      return res.status(400).json({ success: false, message: 'Invalid status value' });
                    }
                      
                    res.status(200).json({ success: true, message: 'All Buses', Bus_Detail: buses });
                  } catch (error) {
                    console.error(error);
                    res.status(500).json({ success: false, message: 'There is an error to find Buses' });
                  }
                }
            
// Api for Get a Route details by Route id
                const getBus = async (req, res) => {
                  try {
                    const bus_no = req.body.bus_no;
                  
                    const bus = await BusModel.findOne({ bus_no });

                    if (!bus) {
                      return res.status(404).json({success : false ,  message: 'BUS not found' });
                    }

                    res.status(200).json({ success : true , message : " BUS found" , Bus_Detail : bus });
                  } catch (err) {
                    res.status(500).json({ success : false , message: 'Error while finding the BUS' });
                  }
                }
                  
  
                                              
  
                                             /*   stops management   */
     
      //API for add stop in Stop Schema 

                        const createStop = async (req,res)=>{          
                        
                        const {stopName} = req.body          
                          
                        try{

                          const requiredFields = [                
                            'stopName',      
                        ];
                    
                        for (const field of requiredFields) {
                            if (!req.body[field]) {
                                return res.status(400).json({ message: `Missing ${field.replace('_', ' ')} field`, success: false });
                            }
                        } 
                        
                        // Check for stopName
                        const existStop = await stopModel.findOne({ stopName });
                                  
                        if (existStop) {
                          return res.status(400).json({ message: ' StopName already exist ', success: false });
                        }

                        const newStop = new stopModel({
                          stopName : stopName
                        })
                          const savedStop = await newStop.save()

                              return res.status(200).json({ success : true , message : `stop added successfully `, stop : savedStop})
                          }
                          catch(error)
                          {
                              console.error(error);
                              return res.status(500).json({ success : false , message : ` an error occured while adding the stop` , error : error})
                          }
                        }
     

    
    // get all stops form the Stop Schema

                      const allStops = async (req, res) => {    
                      
                          try {         
                            
                          
                            const stops = await stopModel.find();         
                              
                            res.status(200).json({ success: true, message: 'All Stops', stop_details : stops });
                          } catch (error) {
                            
                            res.status(500).json({ success: false, message: 'There is an error to find all Stops ' });
                          }
                        }
                            
    // Delete a particular stop by stopId 
                
                        const deleteStop = async (req, res) => {
                          try {
                            const stopId = req.params.stopId;
                        
                            // Check for route existence
                            const existingStop = await stopModel.findOne({ _id: stopId });
                            if (!existingStop) {
                              return res.status(404).json({ success: false, error: `stop not found` });
                            }
                        
                            // Delete the route from the database
                            await existingStop.deleteOne();
                            
                            res.status(200).json({ success: true, message: 'Stop deleted successfully' });
                          } catch (error) {
                            console.error(error);
                            res.status(500).json({ success: false, message: 'Error while deleting the Stop' });
                          }
                        };
            
                          

                                                    /* Route Management */

// Api for Add Route
                 
                  const addRoute = async(req,res)=>{
                    try{
                        const { s_no , routeNumber ,source , destination, status,
                                stops } = req.body
                      
                        
                        
                                // check field validation
                                const requiredFields = [
                                  's_no',
                                  'routeNumber',
                                  'source',            
                                  'destination'
                                  
                              ];
                          
                              for (const field of requiredFields) {
                                  if (!req.body[field]) {
                                      return res.status(400).json({ message: `Missing ${field.replace('_', ' ')} field`, success: false });
                                  }
                              }
                                
                                // check for route existance 
                          const existRoute = await BusRoute.findOne({ routeNumber })
                              if(existRoute)
                              {
                            return res.status(400).json({ success : false ,  message : `route already exit with the route number : ${routeNumber} `})
                            }
                              
                        const newRoute = new BusRoute({

                            s_no : s_no,
                            routeNumber : routeNumber,
                            source : source,
                            destination : destination,
                            stops : stops
                                            
                          });
                                
                          
                            // Save the new route to the database
                                  await newRoute.save();

                      return res.status(200).json({ success: true, message: 'Route added successfully ',  routeNumber : routeNumber , details : newRoute});
                          }
                          catch (error) {
                                    console.error(error);
                          return res.status(500).json({ success: false, message: 'An error occurred while add route' });
                        }
                      }

// API for Get all route 
                                        
                    const allroutes = async (req, res) => {
                        try {
                    
                        const status = req.query.status;

                        let Routes;
                        if (status === 'active' || status === 'inactive') {
                            Routes = await BusRoute.find({ status: status });
                        } else {
                            Routes = await BusRoute.find({});
                        }

                        res.status(200).json({success: true , message: 'All Routes', Route_Detail : Routes });
                        } catch (error) {
                        res.status(500).json({success : false, message: 'There is an error to find Routes' + error.message});
                        }
                    }


// API for Edit Route 
                              const editRoute = async (req, res) => {
                                try {
                                    const routeId = req.params.routeId;
                                    
                                    const {
                                        
                                        source,
                                        destination,                                                                   
                                        status
                                        
                                    } = req.body;                                       
                                   

                                    // Check for route existence
                                    const existRoute = await BusRoute.findOne({ _id: routeId });
                                    if (!existRoute) {
                                        return res.status(404).json({ success: false, message: `Route not found` });
                                    }
                                    
                                    // Update the properties of the existing route
                                    
                                    existRoute.source = source;
                                    existRoute.destination = destination;                                                       
                                    existRoute.status = status;                                   
                                  
                                    // Save the updated route details to the database
                                    const updatedRoute = await existRoute.save();
                                    res.status(200).json({ success: true, message: 'Route Details Edited Successfully', route: updatedRoute });
                                } catch (error) {
                                    console.error(error);
                                    res.status(500).json({ success: false, message: 'Error while editing the route details' });
                                }
                              };

     //API for add stop in a bus with bus id 

                          const addStop_in_Route = async (req,res)=>{
                                  
                            const routeId = req.params.routeId
                          const {stopName , EstimatedTimeTaken, distance} = req.body          
                            
                          try{

                            const requiredFields = [                
                              'stopName', 
                              'EstimatedTimeTaken',                                                                          
                              'distance'          
                      
                          ];

                          for (const field of requiredFields) {
                              if (!req.body[field]) {
                                  return res.status(400).json({ message: `Missing ${field.replace('_', ' ')} field`, success: false });
                              }
                          }
                                      
                                const route = await BusRoute.findOne({ _id:routeId })
                          
                                if(!route)
                                {
                                    return res.status(400).json({ success : false , message : `route not found with the routeId ${routeId}`})
                                }
                                       // Check if the stopName exists in the StopModel
                                  const existingStop = await stopModel.findOne({ stopName });

                                  if (!existingStop) {
                                    return res.status(400).json({ success: false, message: `Stop '${stopName}' does not exist in stops Database` });
                                  }
                                 //  stops is an array in the BusRoute model
                                  const duplicateStop = route.stops.find((stop) => stop.stopName === stopName);

                                  if (duplicateStop) {
                                    return res.status(400).json({ success: false, message: `Stop '${stopName}' already exists in a route` });
                                  }

                                   // Split the EstimatedTimeTaken string into hours and minutes
                                  const timeParts = EstimatedTimeTaken.split(',');
                                  
                                  if (timeParts.length !== 2) {
                                    return res.status(400).json({ success: false, message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.` });
                                  }

                                  const [hoursPart, minutesPart] = timeParts.map(part => part.trim());

                                  const hoursMatch = hoursPart.match(/(\d+)\s*Hour/i);
                                  const minutesMatch = minutesPart.match(/(\d+)\s*Minute/i);

                                  if (!hoursMatch || !minutesMatch) {
                                    return res.status(400).json({ success: false, message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.` });
                                  }

                                  const hours = parseInt(hoursMatch[1]);
                                  const minutes = parseInt(minutesMatch[1]);

                                  // Calculate the total time in minutes
                                  const totalMinutes = hours * 60 + minutes;
                                    
                                route.stops.push({
                                    stopName, 
                                    EstimatedTimeTaken : `${hours} Hour, ${minutes} Minute`,                               
                                    distance
                                })
                                await route.save()
                                 

                                return res.status(200).json({ success : true , message : `stop added successfully in routeID : ${routeId}`})
                            }
                            catch(error)
                            {
                                 console.error(error);
                                return res.status(500).json({ success : false , message : ` an error occured while adding the stop` , error : error})
                            }
                          }
                          
                          
                          
                          
                          
                            
                          

      // Api for Edit Stop in a Route
                        
                      const editStop_in_Route = async (req, res) => {
                        let routeId;
                        try {
                          const stopId = req.params.stopId;
                          routeId = req.params.routeId;
                      
                          const { EstimatedTimeTaken, distance } = req.body;
                      
                          // Check for route existence
                          const existRoute = await BusRoute.findOne({ _id: routeId });
                          if (!existRoute) {
                            return res.status(404).json({ success: false, message: "Route not found" });
                          }
                      
                          // Check if the stops array exists within existRoute
                          if (!existRoute.stops || !Array.isArray(existRoute.stops)) {
                            return res
                              .status(400)
                              .json({ success: false, message: "Stops not found in the route" });
                          }
                      
                          // Check for stopIndex
                          const existStopIndex = existRoute.stops.findIndex(
                            (stop) => stop._id.toString() === stopId
                          );
                          if (existStopIndex === -1) {
                            return res.status(404).json({ success: false, message: "Stop not found" });
                          }
                      
                          // Split the EstimatedTimeTaken string into hours and minutes
                          const timeParts = EstimatedTimeTaken.split(",");
                          if (timeParts.length !== 2) {
                            return res.status(400).json({
                              success: false,
                              message: "Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.",
                            });
                          }
                      
                          const [hoursPart, minutesPart] = timeParts.map((part) => part.trim());
                      
                          const hoursMatch = hoursPart.match(/(\d+)\s*Hour/);
                          const minutesMatch = minutesPart.match(/(\d+)\s*Minute/);
                      
                          if (!hoursMatch || !minutesMatch) {
                            return res.status(400).json({
                              success: false,
                              message: "Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.",
                            });
                          }
                      
                          // Extract hours and minutes from the regex matches
                          const hours = parseInt(hoursMatch[1]);
                          const minutes = parseInt(minutesMatch[1]);
                      
                          // Update the properties of the stop
                          existRoute.stops[existStopIndex].EstimatedTimeTaken = `${hours} Hour, ${minutes} Minute`;
                          existRoute.stops[existStopIndex].distance = distance;
                      
                          // Save the updated route back to the database
                          await existRoute.save();
                      
                          res.status(200).json({
                            success: true,
                            message: `Stop is edited successfully for routeId: ${routeId}`,
                          });
                        } catch (error) {
                          console.error(error);
                          res.status(500).json({
                            success: false,
                            message: `There is an error to update the stop in routeId: ${routeId}`,
                          });
                        }
                      };

      // Api to add stop before the stop in a route
                                    const addStopBeforeStop = async (req, res) => {
                                      const routeId = req.params.routeId;
                                      const { beforeStopName, stopName, EstimatedTimeTaken , distance } = req.body;
                                  
                                      try {
                                          const requiredFields = [
                                              'beforeStopName',
                                              'stopName',   
                                              'EstimatedTimeTaken',                                                      
                                              'distance'
                                          ];
                                  
                                          for (const field of requiredFields) {
                                              if (!req.body[field]) {
                                                  return res.status(400).json({ message: `Missing ${field.replace('_', ' ')} field`, success: false });
                                              }
                                          }
                                  
                                          const route = await BusRoute.findOne({ _id: routeId });
                                  
                                          if (!route) {
                                              return res.status(400).json({ success: false, message: `route not found with the route ID ${routeId}` });
                                          }
                                          
                                              // Check if the stopName exists in the StopModel
                                              const existingStop = await stopModel.findOne({ stopName });

                                            if (!existingStop) {
                                                return res.status(400).json({ success: false, message: `Stop '${stopName}' does not exist in stops Database` });
                                                }
                                  
                                          const beforeStopIndex = route.stops.findIndex(stop => stop.stopName === beforeStopName);
                                  
                                          if (beforeStopIndex === -1) {
                                              return res.status(400).json({ success: false, message : `Stop '${beforeStopName}' not found on the route` });
                                          }
                                          //  stops is an array in the BusRoute model
                                          const duplicateStop = route.stops.find((stop) => stop.stopName === stopName);

                                          if (duplicateStop) {
                                            return res.status(400).json({ success: false, message: `Stop '${stopName}' already exists in a route` });
                                          }

                                          // Split the EstimatedTimeTaken string into hours and minutes
                                          const timeParts = EstimatedTimeTaken.split(',');
                                          
                                          if (timeParts.length !== 2) {
                                            return res.status(400).json({ success: false, message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.` });
                                          }

                                          const [hoursPart, minutesPart] = timeParts.map(part => part.trim());

                                          const hoursMatch = hoursPart.match(/(\d+)\s*Hour/i);
                                          const minutesMatch = minutesPart.match(/(\d+)\s*Minute/i);

                                          if (!hoursMatch || !minutesMatch) {
                                            return res.status(400).json({ success: false, message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.` });
                                          }

                                          const hours = parseInt(hoursMatch[1]);
                                          const minutes = parseInt(minutesMatch[1]);

                                          // Calculate the total time in minutes
                                          const totalMinutes = hours * 60 + minutes;
                                            
                                  
                                          const newStop = {
                                            stopName, 
                                            EstimatedTimeTaken : `${hours} Hour, ${minutes} Minute`,                               
                                            distance
                                          };
                                  
                                          route.stops.splice(beforeStopIndex, 0, newStop);
                                          await route.save();
                                  
                                          return res.status(200).json({ success: true, message: `Stop '${stopName}' added successfully before '${beforeStopName}' on routeId: ${routeId}` });
                                      } catch (error) {
                                          return res.status(500).json({ success: false, message: 'An error occurred while adding the stop', error });
                                      }
                                  };

                      
    
    // Delete a particular stop by stopId with the help of bus
                
                      const deleteStop_in_Route = async (req ,res)=>{
                        let routeId 
                        try{
                              const stopId = req.params.stopId
                              routeId = req.params.routeId
                              const existRoute = await BusRoute.findById(routeId)   
                                                          
                              if(!existRoute)
                              {
                                return res.status(404).json({ success : false , message : " Route not found"})
                              }
                              
                              // check for stop
                              const existStopIndex = existRoute.stops.findIndex(stop => stop._id.toString() === stopId)
                                if(existStopIndex === -1)
                                {
                                  return res.status(404).json({ success : false , message : " Stop not found"})
                                  }  
                                  // remove the stop from the stop array
                                  
                                  existRoute.stops.splice(existStopIndex, 1)

                                  await BusRoute.findByIdAndUpdate(
                                        { _id:routeId },
                                        {stops : existRoute.stops}
                                  )

                                  res.status(200).json({ success : true , message : "stop delete successfully in Route"})
                        
                          }
                        catch(error)
                        {
                              res.status(500).json({ success : false , message :  ` there is an error to delete the stop `})
                        }
                        }         




    // Api for delete Route 
                        const deleteRoute = async (req, res) => {
                          try {
                            const routeId = req.params.routeId;
                        
                            // Check for route existence
                            const existingRoute = await BusRoute.findOne({ _id: routeId });
                            if (!existingRoute) {
                              return res.status(404).json({ success: false, message: `Route not found` });
                            }
                        
                            // Delete the route from the database
                            await existingRoute.deleteOne();
                            
                            res.status(200).json({ success: true, message: 'Route deleted successfully' });
                          } catch (error) {
                            console.error(error);
                            res.status(500).json({ success: false, message : 'Error while deleting the route' });
                          }
                        };
    
   
    
                                              /* Change Profile */
// ApI for change Porfile 
              const changeProfile = async(req,res)=>{
                try{
                       const AdminId = req.params.AdminId
                 // check for Admin exist
                 const admin = await Admin.findById(AdminId)
                 if(!admin){
                  return res.status(404).json({ success : false , message : 'Admin not found'})
                 }               
                      
                       if(req.file)
                  {
                    admin.profileImage = req.file.filename                 
                  }                   
                      await admin.save()
                      return res.status(200).json({ success: true, message: 'Admin profile change successfully' });
                }
                catch(error)
                {                  
                  res.status(500).json({ success : false , message : ' Error while changing Admin profile'})
                }
              }

                                                    /*   Driver Manage  */

  //Api for add New Driver
                                const addDriver = async (req, res) => {
                                  try {
                                    const { driverId ,driverName, driverContact, driverLicence_number, status , driverProfileImage } = req.body;

                                    const requiredFields = [
                                      'driverId',                
                                      'driverName',
                                      'driverContact',            
                                      'driverLicence_number',             
                                      'status'                                         
                                
                            ];
                        
                            for (const field of requiredFields) {
                                if (!req.body[field]) {
                                    return res.status(400).json({ message: `Missing ${field.replace('_', ' ')} field`, success: false });
                                }
                            }                                              
                                    // Check for driver existence
                                    const existingDriver = await DriverModel.findOne({ driverId });
                                    if (existingDriver) {
                                      return res.status(400).json({ success: false, message :'driver already exist' });
                                    }                                   
                                
                                    // Check for valid driver status
                                    const validStatus = ['active', 'inactive'];
                                    const driverStatus = validStatus.includes(status) ? status : 'active';

                                  
                                    const newDriver = new DriverModel({
                                      driverId,
                                      driverName,
                                      driverContact,
                                      driverLicence_number,
                                      status: driverStatus
                                      
                                    });  

                                          
                                          // set Driver availability  and profile Images
                                    newDriver.availability = 'available'; 
                                    if (req.file) {
                                      newDriver.driverProfileImage = req.file.filename;
                                    }             
                                
                                    const savedDriver = await newDriver.save();
                                    res.status(200).json({ success: true, message: ' New Driver added successfully', driver: savedDriver });
                                  } catch (error) {
                                    console.error(error);
                                    res.status(500).json({ success: false, message: 'Error adding driver details' });
                                  }
                                };
        
      // Api for edit Driver Details
                                    const editDriver = async (req, res) => {
                                      try {
                                        const driverId = req.params.driverId;
                                        const {
                                          driverName,
                                          driverContact,
                                          status,
                                          availability,
                                        } = req.body;
                                    
                                        // Check for valid status and availability values
                                        const validStatus = ['active', 'inactive'];
                                        const validAvailability = ['available', 'unavailable'];
                                    
                                        if (!validStatus.includes(status)) {
                                          return res.status(400).json({ message: 'Invalid status value', success: false });
                                        }
                                    
                                        if (!validAvailability.includes(availability)) {
                                          return res.status(400).json({ message: 'Invalid availability value', success: false });
                                        }
                                    
                                        if (status === 'inactive' && availability !== 'unavailable') {
                                          return res.status(400).json({ message: 'Driver status can only be set to inactive when availability is unavailable', success: false });
                                        }
                                    
                                        if (availability === 'unavailable' && status !== 'inactive') {
                                          return res.status(400).json({ message: 'Driver availability can only be set to unavailable when status is inactive', success: false });
                                        }
                                    
                                        // Check for driver existence
                                        const existingDriver = await DriverModel.findOne({ _id: driverId });
                                    
                                        if (!existingDriver) {
                                          return res.status(404).json({ success: false, message: 'Driver not found' });
                                        }
                                    
                                        // Update the Driver properties
                                        existingDriver.driverName = driverName;
                                        existingDriver.driverContact = driverContact;
                                        existingDriver.status = status;
                                        existingDriver.availability = availability;
                                    
                                        // Update driver profile image if a file is provided
                                        if (req.file) {
                                          existingDriver.driverProfileImage = req.file.filename;
                                        }
                                    
                                        // Save the updated driver data into the database
                                        const updatedDriver = await existingDriver.save();
                                    
                                        res.status(200).json({ success: true, message: 'Driver details updated successfully', Driver: updatedDriver });
                                      } catch (error) {
                                        console.error(error);
                                        res.status(500).json({ success: false, error: 'There was an error updating the driver details' });
                                      }
                                    };
                    
  
        // Api for Delete Driver
                            const deleteDriver = async (req, res) => {
                              try {
                                const driverId = req.params.driverId;
                                const driver = await DriverModel.findById(driverId);
                            
                                if (!driver) {
                                  return res.status(404).json({ success: false, error: 'driver not found' });
                                }
                                // Check if driver status is inactive and availability is unavailable
                                if (driver.status === 'inactive' && driver.availability === 'unavailable') {
                                  await driver.deleteOne();
                                  res.status(200).json({ success: true, message: 'Driver deleted successfully' });
                                } else {
                                  res.status(400).json({ success: false, message: 'Driver booked with other bus and route ' });
                                }
                                }
                                catch (error) {                    
                                    res.status(500).json({success : false , message: 'Error while deleting the Driver' });
                                  }
                                };

      // Api for get all driver
                            const allDrivers = async (req, res) => {
                              try {
                                const status = req.query.status;
                            
                                let Drivers;
                                if (status === 'active') {
                                  Drivers = await DriverModel.find({ status: 'active', availability: { $in: ['available', 'booked'] } });
                                } else if (status === 'inactive') {
                                  buses = await DriverModel.find({ status: 'inactive', availability: 'unavailable' });
                                } else {
                                  return res.status(400).json({ success: false, message : 'Invalid status value' });
                                }
                                  
                                res.status(200).json({ success: true, message: 'All Drivers', Driver_Details: Drivers });
                              } catch (error) {
                                
                                res.status(500).json({ success: false, message : 'There is an error to find Drivers' });
                              }
                            }
               
    // Api for Get a driver details by driver id
                              const getDriver = async (req, res) => {
                                try {
                                  const driverId = req.params.driverId;
                                  const driver = await DriverModel.findById(driverId);

                                  if (!driver) {
                                    return res.status(404).json({success : false ,  message: 'Driver not found' });
                                  }

                                  res.status(200).json({ success : true , message : " driver found" , Driver_Details : driver });
                                } catch (err) {
                                  res.status(500).json({ success : false , message: 'Error while finding the driver' });
                                }
                              }


                                                        /* TRIP Management */


//API for create a new trip
                    const createTrip = async(req,res) =>{
                      try{
                        const {
                          tripNumber,
                          bus_no,
                          driverId,
                          routeNumber,
                          startingDate,
                          endDate,  
                          startingTime,                        
                          status
                         
                        } = req.body

                        const requiredFields = [
                          'bus_no',
                          'driverId',
                          'routeNumber',
                          'startingDate',
                          'endDate' ,
                          'startingTime'                    

                        ]
                        for(const field of requiredFields){
                          if(!req.body[field]){
                            return res.status(400).json({ message : `missing ${field.replace('_',' ')} field`, success : false})
                          }
                        }
                       
                           // Check if a trip with the same bus number and startingDate already exists
                                const existingbus = await TripModel.findOne({
                                  bus_no,
                                  startingDate,
                                });
                                    
                                if (existingbus) {
                                  return res
                                    .status(400)
                                    .json({
                                      message: 'A trip with the same Bus and starting date already exists',
                                      success: false,
                                    });
                                }
                                
                           
                           // Check if a trip with the same driver ID and startingDate already exists
                                const existingdriver = await TripModel.findOne({
                                  driverId,
                                  startingDate,
                                });

                                if (existingdriver) {
                                  return res
                                    .status(400)
                                    .json({
                                      message: 'A trip with the same Driver and starting date already exists',
                                      success: false,
                                    });
                                }
                                      
                                // check for Trip number
                                const existingTripNumber = await TripModel.findOne({
                                  tripNumber,
                                      })
                                      if(existingTripNumber)
                                      {
                                        return res.status(400).json({
                                                    message : ' trip number already exist',
                                                    success : false
                                        })
                                      }

                        // Check for bus number
                        const bus = await BusModel.findOne({ bus_no });
                    
                        if (!bus) {
                          return res.status(400).json({ message : 'Bus not found ', success: false });
                        }
                           
                        const { bus_type , amenities , images } = bus
                        // Check for Route number
                        const route = await BusRoute.findOne({ routeNumber });
                    
                        if (!route) {
                          return res.status(400).json({ message: 'Route not found', success: false });
                        }
                          // Check for Driver existence
                          const driver = await DriverModel.findOne({ driverId })

                          if (!driver) {
                            return res.status(400).json({ message : 'Driver with the specified ID not exist', success: false });
                          }  
                              
                              // Create an array for available seats
                          const busCapacity = bus.seating_capacity;
                          const Available_seat = Array.from({ length: busCapacity }, (_, index) => index + 1);
                                
                             

                            const newTrip = new TripModel({
                              tripNumber,
                              startingDate,
                              endDate,
                              source : route.source,
                              destination :route.destination,
                              startingTime,
                              bus_no,
                              driverId,
                              routeNumber,                                                                               
                              status,
                              Available_seat,
                              bus_type,
                              amenities,
                              images,
                            })

                            const savedTrip = await newTrip.save()
                            res.status(200).json({ success : true , message : 'new trip created successfully', Trip_Detail : savedTrip})

                      }
                      catch(error)
                      {
                           console.error(error);
                            res.status(500).json({success : false , message : ' there is an error while creating the trip'})
                      }
                    } 

                                // schedule a job to update trip status
                                
                                cron.schedule('* * * * *', async ()=>{
                                  try{
                                    const currentDate = new Date()
                                         // find trips with end Date
                                    const expiredTrips = await TripModel.find({
                                      endDate : {
                                        $lt : currentDate
                                      }                                     
                                    })
                                    if(expiredTrips.length > 0)
                                     {
                                        await TripModel.updateMany({ _id:{
                                                                  $in : expiredTrips.map(trip => trip._id)}} ,
                                                                   { status : 'completed'}
                                                                   )
                                          }
                                           }
                                             catch(error)
                                                 {
                                                console.error('Error while updating trip status :', error);
                                                 }
                                     })
      // Api to get all the Trip for a particular StartingDate
                                    const allTrips =  async (req, res) => {
                                      try {
                                        // const { startingDate } = req.query;
                                    
                                        // if (!startingDate) {
                                        //   return res.status(400).json({ error: 'Starting date is required', success: false });
                                        // }
                                    
                                        // Find trips with the specified startingDate
                                        const trips = await TripModel.find();
                                    
                                        if (trips.length === 0) {
                                          return res.status(404).json({ message: 'No trips found for the specified startingDate', success: false });
                                        }
                                    
                                        res.status(200).json({ success: true, trips });
                                      } catch (error) {
                                        console.error(error);
                                        res.status(500).json({ success: false, message: 'There was an error while fetching trips' });
                                      }
                                    };
                                     
      // Api for searchtrips    
                                  const searchTrips = async (req, res) => {
                                    try {
                                      const { sourceStop, destinationStop, date } = req.body;
                                  
                                      // Find trips that match the given date
                                      const trips = await TripModel.find({
                                        startingDate: { $lte: date },
                                        endDate: { $gte: date }
                                      });
                                  
                                      if (!trips || trips.length === 0) {
                                        return res.status(400).json({
                                          success: false,
                                          message: 'No matching trips found for the selected date'
                                        });
                                      }
                                  
                                      // Filter trips to include only those with matching source and destination stops
                                      const matchingTrips = [];
                                  
                                      for (const trip of trips) {
                                        const routeNumber = trip.routeNumber;
                                        // Find the route with the same routeNumber
                                        const route = await BusRoute.findOne({ routeNumber });
                                  
                                        if (!route) {
                                          continue; 
                                        }
                                  
                                        const sourceIndex = route.stops.findIndex((stop) => stop.stopName === sourceStop);
                                        const destinationIndex = route.stops.findIndex((stop) => stop.stopName === destinationStop);
                                  
                                        if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex) {
                                          const stops = sourceIndex + 1 < destinationIndex ? route.stops.slice(sourceIndex + 1, destinationIndex) : [];
        
                                          matchingTrips.push({
                                            trip ,
                                            stops} );
                                        }
                                      }
                                  
                                      if (matchingTrips.length === 0) {
                                        return res.status(400).json({
                                          success: false,
                                          message: 'No matching trips found for the selected stops'
                                        });
                                      }
                                  
                                      res.status(200).json({
                                        success: true,
                                        message: 'Trips for the search criteria',
                                        trips: matchingTrips
                                      });
                                    } catch (error) {
                                      res.status(500).json({
                                        success: false,
                                        message: 'Error while fetching the data'
                                      });
                                    }
                                  };

                 
 // API for View seats in Bus for a trip
                            
                                const viewSeats = async (req, res) => {
                                  try {
                                    const tripId = req.body.tripId

                                    // Find the trip by its ID
                                    const trip = await TripModel.findById(tripId);

                                    if (!trip) {
                                      return res.status(404).json({ success: false, error: 'Trip not found' });
                                    }
                                    
                                    let tripNumber = trip.tripNumber;

                                    // Initialize seats array with status codes
                                    let seats = [];

                                    
                                    const bookingsOnDate = await BookingModel.find({
                                      tripId,
                                      status: 'confirmed',
                                    });

                                    // If there are bookings on the given trip, populate seats array
                                    if (bookingsOnDate.length > 0) {
                                      const bookedSeats = [].concat(...bookingsOnDate.map((booking) => booking.selectedSeatNumbers));
                                      trip.Available_seat.forEach((seat) => {
                                        const status = bookedSeats.includes(seat) ? 1 : 0;
                                        seats.push({ seat, status });
                                      });
                                      
                                      // Also add the booked seats with status 1
                                      bookedSeats.forEach((seat) => {
                                        seats.push({ seat, status: 1 });
                                      });
                                    } else {
                                      // If there are no bookings, all seats are marked as available.
                                      trip.Available_seat.forEach((seat) => {
                                        seats.push({ seat, status: 0 });
                                      });
                                    }

                                    res.status(200).json({
                                      success: true,
                                      message: 'Seat information in a Trip for the Bus',
                                      tripNumber: tripNumber,
                                      Seat_Info: seats,
                                    });
                                  } catch (error) {
                                    console.error(error);
                                    res.status(500).json({ success: false, error: 'Error while fetching seat information' });
                                  }
                                };





// APi for calculateFareFor selected seats in Bus for trip
                            
                const calculateFareForSelectedSeats = async (req, res) => {
                  try {
                    const tripId = req.params.tripId;
                    const {selectedSeatNumbers , passengerAges} = req.body; 
                    const { sourceStop, destinationStop } = req.query;
                        
                      
                    // Find the trip by its ID
                    const trip = await TripModel.findById(tripId);
                          
                    if (!trip) {
                      return res.status(404).json({ success: false, message: 'Trip not found' });
                    }
                          
                    if (
                      !Array.isArray(selectedSeatNumbers) ||
                      selectedSeatNumbers.length === 0 ||
                      selectedSeatNumbers.some(seatNumber => isNaN(seatNumber)) ||
                      !Array.isArray(passengerAges) ||
                      passengerAges.length === 0 ||
                      passengerAges.some(age => isNaN(age))
                    ) {
                      return res.status(400).json({
                        message: 'Invalid or empty selected seat numbers or passenger ages',
                        success: false,
                      });
                    }

                    // Access the available seats from the trip
                    const availableSeats = trip.Available_seat || [];
                    const routeNumber = trip.routeNumber;

                    // Calculate the distance between source and destination stops
                    const route = await BusRoute.findOne({ routeNumber });
                    if (!route) {
                      return res.status(400).json({
                        success: false,
                        error: 'Route not found',
                      });
                    }

                    const stops = route.stops || [];
                    const distance = calculateDistanceBetweenStops(stops, sourceStop, destinationStop);

                    // Calculate fares for each passenger based on age group
                    const fares = selectedSeatNumbers.map((seatNumber , index) => {
                      // Check the bus type and set farePerUnitDistance accordingly
                      let farePerUnitDistance;
                      // Inside the calculateFareForSelectedSeats function
                    
                      const bus_no = trip.bus_no;
                    
                      const bus =  BusModel.findOne({
                            bus_no
                      })
                      if(!bus_no)
                      {
                        return res.status(400).json({
                          success : false,
                          message : 'Bus not found'

                        })
                      }

                      let bus_type = trip.bus_type
                        
                        

                      // Within the switch statement
                      switch (bus_type) {
                        case 'Non-AC' || 'Non-Ac':
                          
                          farePerUnitDistance = 0.2;
                          break;
                        case 'AC' || 'Ac':
                        
                          farePerUnitDistance = 0.24;
                          break;
                        case 'luxury':
                        
                          farePerUnitDistance = 0.3;
                          break;
                        default:
                          console.log("Fare type: Default");
                          farePerUnitDistance = 0.2;
                      }

                          

                      // Calculate the age group of the passenger
                      const ageGroup = calculateAgeGroup(passengerAges[index]);

                      // Calculate the total fare for the passenger
                      const totalFare = distance * farePerUnitDistance;

                      // Calculate the seat fare based on age group
                      let seatFare;
                      switch (ageGroup) {
                        case 'baby':
                          seatFare = 0.0; // Babies travel free
                          break;
                        case 'children':
                          seatFare = totalFare * 0.5; // Half fare for children
                          break;
                        case 'adult':
                          seatFare = totalFare; // Full fare for adults
                          break;
                        default:
                          seatFare = totalFare;
                      }

                      return {
                        success: true,
                        message: 'Fare calculated successfully',
                        busType: bus_type,
                        boardingPoint: sourceStop,
                        droppingPoint: destinationStop,
                        seatNumber: seatNumber,
                        Fare_in_Euro: totalFare,
                        passengerAge: passengerAges[index],
                        ageGroup: ageGroup,
                        seatFare: seatFare,
                      };
                    });
                    // Calculate the total fare by summing up the seat fares of all passengers
                        const totalFare = fares.reduce((acc, passenger) => acc + passenger.seatFare, 0);


                    return res.status(200).json({
                      success : true,
                      message : 'Total fare calculated successfully',
                      totalFare_in_Euro : totalFare,
                      passengersfare : fares
                    });
                  } catch (error) {
                    console.error(error);
                    return res.status(500).json({ success: false, error: 'An error occurred while calculating fare' });
                  }
                };

                // Helper function to calculate distance between stops
                function calculateDistanceBetweenStops(stops, sourceStop, destinationStop) {
                  const sourceIndex = stops.findIndex((stop) => stop.stopName === sourceStop);
                  const destinationIndex = stops.findIndex((stop) => stop.stopName === destinationStop);

                  if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex >= destinationIndex) {
                    return 0;
                  }

                  let distance = 0;
                  for (let i = sourceIndex; i < destinationIndex; i++) {
                    distance += stops[i + 1].distance - stops[i].distance;
                  }

                  return distance;
                }

                function calculateAgeGroup(age) {
                  if (age > 0 && age <= 2) {
                    return 'baby';
                  } else if (age > 2 && age <= 21) {
                    return 'children';
                  } else {
                    return 'adult';
                  }
                }





                                             /*  Manage Tickit */



    // api for book tickit               
       
                                      const bookTicket = async (req, res) => {
                                        try {
                                          const { tripId } = req.params;
                                          const {
                                            date,
                                            selectedSeatNumbers,
                                            status,
                                            email,
                                            passengers,
                                            totalFare_in_Euro,
                                            number,
                                            exp_month,
                                            exp_year ,   
                                            cvc                          
                                            
                                          } = req.body;
                                      
                                          const { source, destination } = req.query;
                                      
                                          // Checking for required fields in the request
                                          const requiredFields = [
                                            'email',
                                            'totalFare_in_Euro',
                                            'selectedSeatNumbers',
                                            'passengers',
                                          ];
                                          for (const field of requiredFields) {
                                            if (!req.body[field]) {
                                              return res.status(400).json({
                                                error: `Missing ${field.replace('_', ' ')} field`,
                                                success: false,
                                              });
                                            }
                                          }
                                      
                                          if (!tripId) {
                                            return res.status(400).json({
                                              success: false,
                                              message: 'Trip ID is missing or undefined',
                                            });
                                          }
                                            
                                          // Fetching user details
                                          const user = await UserModel.findOne({ email });
                                          if (!user) {
                                            return res.status(400).json({
                                              success: false,
                                              message: 'User not found',
                                            });
                                          }
                                          const userId = user._id;
                                      
                                          // Fetch trip and check if it exists
                                          const trip = await TripModel.findById(tripId);
                                       
                                      
                                          if (!trip) {
                                            return res.status(400).json({
                                              success: false,
                                              message : 'Trip not found',
                                            });
                                          }
                                      
                                          const bus_no = trip.bus_no;
                                      
                                          if (!bus_no) {
                                            return res.status(400).json({
                                              success: false,
                                              message : 'busId not found',
                                            });
                                          }
                                      
                                          const bus = await BusModel.findOne({ bus_no });
                                          if (!bus) {
                                            return res.status(400).json({
                                              success: false,
                                              message : 'Bus Details not found',
                                            });
                                          }
                                      
                                          const driverId = trip.driverId;
                                          const Driver = await DriverModel.findOne({ driverId });
                                      
                                          if (!Driver) {
                                            return res.status(400).json({
                                              success: false,
                                              message: 'Driver not found',
                                            });
                                          }
                                      
                                          if (
                                            !Array.isArray(selectedSeatNumbers) ||
                                            selectedSeatNumbers.length !== passengers.length
                                          ) {
                                            return res.status(400).json({
                                              success: false,
                                              message : 'Invalid selected seat numbers',
                                            });
                                          }
                                      
                                        // Check if selected seats are available in the trip's Available_seat array
                                      
                                          for (const seat of selectedSeatNumbers) {
                                            if (!trip.Available_seat.includes(seat)) {
                                              return res.status(400).json({
                                                success: false,
                                                message: `Seat ${seat} is already booked`,
                                              });
                                            }
                                          }
                                           
                                            // Check if selected seat is already booked in a trip
                                                        const bookedSeats = trip.booked_seat || [];

                                                        for (const seat of selectedSeatNumbers) {
                                                          if (bookedSeats.includes(seat)) {
                                                            return res.status(400).json({
                                                              success: false,
                                                              message: `Seat ${seat} is already booked`,
                                                            });
                                                          }
                                                        }
                                      
                                          // Update Available_seat and bookedSeats arrays in the trip
                                          if (Array.isArray(trip.Available_seat)) {
                                            for (const seat of selectedSeatNumbers) {
                                              const index = trip.Available_seat.indexOf(seat);
                                              if (index !== -1) {
                                                trip.Available_seat.splice(index, 1);
                                                trip.booked_seat.push(seat);
                                              }
                                            }
                                          }                                      

                                          
                                          // Check if selected seats are already booked on the same date in the booking model
                                          const existingBookings = await BookingModel.find({
                                            tripId,
                                            date,
                                            status : 'confirmed',
                                            selectedSeatNumbers: {
                                              $in: selectedSeatNumbers,
                                            },
                                          });
                                         
                                          if (existingBookings.length > 0) {
                                            // Some selected seats are already booked for the same trip and date
                                            const bookedSeatNumbers = existingBookings.map(
                                              (booking) => booking.selectedSeatNumbers
                                            );
                                      
                                            return res.status(400).json({
                                              success: false,
                                              message: `Seats ${selectedSeatNumbers.join(', ')} are already booked for this trip`,
                                            });
                                          }
                                            // Create a customer in Stripe
                                            const customer = await stripe.customers.create({
                                              email: email, 
                                            });
                                            // Store the customer ID in your database or application
                                            const customerId = customer.id;
                                              
                                        //  Create a Payment Method for testing purposes

                                          const paymentMethod = await stripe.paymentMethods.create({
                                            type: 'card',
                                            card: {
                                              number: number,
                                              exp_month: exp_month,
                                              exp_year: exp_year,
                                              cvc: cvc,
                                            },
                                          });
                                            // Attach the payment method to the customer
                                              await stripe.paymentMethods.attach(paymentMethod.id, {
                                                customer: customerId,
                                              });
                                              const totalFareInCents = totalFare_in_Euro * 100 
                                            //Create a Payment Intent
                                            const paymentIntent = await stripe.paymentIntents.create({
                                              amount:totalFareInCents,
                                              currency: 'usd',
                                              description: 'Bus ticket booking',
                                              payment_method: paymentMethod.id,
                                              customer: customerId,
                                              confirm: true,
                                              receipt_email : email,
                                              return_url: 'http://localhost:4000/',
                                            });

                                          if (paymentIntent.status !== 'succeeded') {
                                            return res.status(400).json({
                                              success: false,
                                              message: 'Payment confirmation failed',
                                            });
                                          }
                                      
                                          // Check if this booking ID has already been paid
                                          const bookingId = shortid.generate();
                                      
                                          const existingTransaction = await TransactionModel.findOne({ bookingId: bookingId });
                                          if (existingTransaction) {
                                            return res.status(400).json({
                                              success: false,
                                              message: 'Booking has already been paid',
                                            });
                                          }
                                      
                                          // Store the payment transaction
                                          const transaction = new TransactionModel({
                                            bookingId: bookingId,
                                            paymentIntentId: paymentIntent.id,
                                            amount: totalFare_in_Euro,
                                            currency: 'usd',
                                            paymentStatus : 'paid',
                                            status: 'success',
                                          });
                                      
                                          await transaction.save();
                                      
                                          // Save the updated trip
                                          await trip.save();
                                      
                                          // Create a new booking
                                          const booking = new BookingModel({
                                            tripId,
                                            date,
                                            status,
                                            bookingId,
                                            userId,
                                            selectedSeatNumbers,
                                            passengers: passengers.map((passenger, index) => ({
                                              ...passenger,
                                              seatNumber: selectedSeatNumbers[index],
                                              ageGroup: calculateAgeGroup(passenger.age),
                                            })),
                                            totalFare: totalFare_in_Euro,
                                          });
                                      
                                          await booking.save();
                                      
                                          // Generate passenger details and email content
                                          const passengerDetails = passengers
                                            .map((passenger, index) => {
                                              const seatNumber = selectedSeatNumbers[index];
                                              return `
                                              <tr>
                                              <td style="border: 2px solid #dadada; border-right: 0; border-left: 0; padding: 10px; font-size: 18px; white-space: nowrap;">
                                                ${passenger.name}
                                              </td>
                                              <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                ${passenger.age}
                                              </td>
                                              <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                ${passenger.gender}
                                              </td>
                                              <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                ${seatNumber}
                                              </td>                                              
                                            </tr>
                                          `;
                                        })
                                        .join('\n');
                                      
                                          const emailContent = `
                                          <main>
                                                <div style="width:700px; border:2px solid #ccc; margin:40px auto;">
                                                  <table style="width: 100%;" cellspacing="0">
                                                  <thead class="card-header">
                                                   <tr>
                                                    <td colspan="4" style="padding: 10px 0px;"><img id="logo" src="https://itdevelopmentservices.com/insphire/public/image/front/img/logo.png" title="InspHired" alt="InspHired" style="width:25%;">
                                                    </td> 
                                                    <td colspan="2" style="font-size:25px; font-weight:700; text-align:right; padding: 0px 10px 0px 0px;">Ticket Details</td> 
                                                   </tr>
                                                    <tr>
                                                     <td  colspan="5" style="border:2px solid #dadada; border-bottom: 0; padding: 15px 0px 15px 10px; font-size:18px; border-right:0; border-left: 0;"><strong>Dear </strong>${user.fullName}</td> 
                                                     <td  colspan="1" style="border:2px solid #dadada; border-bottom: 0; padding: 15px 10px 15px 0px; font-size:18px; border-left: 0; border-right: 0; text-align:right;"></td>
                                                    </tr>
                                                    <tr>
                                                     <td  colspan="5" style="border:2px solid #dadada; border-top: 0; padding:0px 0px 15px 10px; font-size:16px; border-right:0; border-left: 0; font-weight:600;"> Your booking for departure on ${date} has been confirmed.</td>  
                                                     <td  colspan="1" style="border:2px solid #dadada; border-top: 0; padding: 15px 10px 15px 0px; font-size:18px; border-left: 0; border-right: 0; text-align:right;"></td> 
                                                    </tr>
                                                    <!-- <tr>
                                                     <td colspan="4" style="font-size:20px; font-weight:700; padding:10px 0px 0px 10px;"><strong>Pay To:</strong></td>
                                                     <td colspan="2" style="font-size:20px; font-weight:700; padding: 10px 10px 0px 0px; text-align:right;"><strong>Invoiced To:</strong></td>
                                                    </tr>
                                                   <tr>
                                                    <td colspan="4" style="padding: 10px;"><address>Koice Inc<br>2705 N. Enterprise St<br>Orange, CA mailto:92865<br>contact@koiceinc.com</address>
                                                    </td>
                                                    <td colspan="2" style="text-align:right; padding: 10px;"><address>Smith Rhodes<br>15 Hodges Mews, High Wycombe<br>HP12 3JL<br>United Kingdom</address>
                                                    </td>    
                                                   </tr>  --> 
                                                    
                                                  </thead>
                                                    <tbody>
                                                      <tr>
                                                        <th style="border-bottom:2px solid #dadada; text-align: left; padding:10px; font-size:18px;"><strong>Booking ID</strong></th>
                                                        <td colspan="6" style="border:2px solid #dadada; padding:10px; font-size:18px; border-top:0; border-right: 0;">${bookingId}</td>
                                                        </tr>
                                                        <tr>
                                                         <th style="border-bottom:2px solid #dadada;  text-align: left; padding:10px; font-size:18px; white-space:nowrap; border-right:0;"><strong>Trip Number</strong>
                                                         </th>
                                                          <td colspan="6" style="border:2px solid #dadada; padding:10px; font-size:18px; border-top:0; border-right: 0;">${trip.tripNumber}</td>
                                                        </tr>  
                                                        <tr>
                                                         <th style="border-bottom:2px solid #dadada; text-align: left; padding:10px; font-size:18px; white-space:nowrap; border-right:0;">
                                                          <strong>Bus Number</strong>
                                                         </th>
                                                         <td colspan="6" style="border:2px solid #dadada; padding:10px; font-size:18px; border-top:0; border-right: 0;">${trip.bus_no}</td>
                                                        </tr>
                                                        <tr>
                                                         <th style="border-bottom:2px solid #dadada; text-align: left; padding:10px; font-size:18px; white-space:nowrap; border-right:0;"><strong>Driver Name</strong>
                                                         </th> 
                                                         <td colspan="6" style="border:2px solid #dadada; padding:10px; font-size:18px; border-top:0; border-right: 0;">${Driver.driverName}</td>
                                                        </tr>
                                                        <tr>
                                                         <th style="border-bottom:2px solid #dadada; text-align: left; padding:10px; font-size:18px; white-space:nowrap; border-right:0;">
                                                          <strong>Driver Contact</strong></th> 
                                                         <td colspan="6" style="border:2px solid #dadada; padding:10px; font-size:18px; border-top:0; border-right: 0;">${Driver.driverContact}</td>
                                                        </tr>
                                                        <tr>
                                                         <th style="border-bottom:2px solid #dadada; text-align: left; padding:10px; font-size:18px; border-right: 0; white-space: nowrap;">
                                                          <strong>Trip Starting Time</strong></th> 
                                                         <td colspan="6" style="border:2px solid #dadada; padding:10px; font-size:18px; border-top:0; border-right: 0;">${trip.startingTime}</td> 
                                                        </tr>
                                                        <tr>
                                                         <th style="border-bottom:2px solid #dadada; text-align: left; padding:10px; font-size:18px; border-right: 0; white-space: nowrap;">
                                                         <strong>Your Source</strong></th> 
                                                         <td colspan="6" style="border:2px solid #dadada; padding:10px; font-size:18px; border-top:0; border-right: 0;">${source}</td>
                                                        </tr>
                                                        <tr>
                                                         <th style="text-align: left; padding:10px; font-size:18px; border-right: 0; white-space: nowrap;">
                                                          <strong>Your Destination</strong></th> 
                                                          <td colspan="6" style="border:2px solid #dadada; border-bottom: 0; padding:10px; font-size:18px; border-top:0; border-right: 0;">${destination}</td>
                                                        </tr>
                                                    </tbody>
                                                    <!-- Passenger Details Section -->
                                                    <thead>
                                                      <tr>
                                                        <td style="border: 2px solid #dadada; border-right: 0; border-left: 0; padding: 10px; font-size: 18px; white-space: nowrap;">
                                                          <strong>Passenger Name</strong>
                                                        </td>
                                                        <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                          <strong>Age</strong>
                                                        </td>
                                                        <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                          <strong>Gender</strong>
                                                        </td>
                                                        <td colspan="3" style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                          <strong>Seat Number</strong>
                                                        </td>
                                                      </tr>
                                                    </thead>
                                                
                                                    <tbody>
                                                      ${passengerDetails}
                                                    </tbody>                                                    
                                                  </table>
                                                       <!-- Footer -->
                                          <!--<a href="javascript:window.print()" class="btn btn-light border text-black-50 shadow-none"><i class="fa fa-print"></i> Print</a>  -->
                                            <!-- <footer class="download-btn-info-area" style="text-align: center; margin:30px;">
                                              <a href="#" class="download-btn" style="background: #138aab; color: #fff; padding: 10px 20px; font-size: 20px; font-weight: 600; 
                                              text-decoration: none; border-radius: 5px;"><i class="fa fa-download"></i> Download</a> 
                                            </footer> -->
                                          
                                          <!-- footer -->
                                              </div>
                                          
                                            </main>
                                            `;
                                          /* Dear ${user.fullName},
                                            Your booking for departure on ${date} has been confirmed.
                                            
                                            Journey Details:
                                                      Booking ID: ${bookingId}
                                                      Trip Number: ${trip.tripNumber}
                                                      Bus Number : ${trip.bus_no}
                                                      Driver Name: ${Driver.driverName}
                                                      Driver Contact: ${Driver.driverContact}
                                                      Trip Starting Time: ${trip.startingTime}
                                                      Your Source: ${source}
                                                      Your Destination: ${destination}
                                          ..............................................................
                                                      Passenger Details:
                                                      ${passengerDetails}
                                          ..............................................................
                                            
                                            Have a safe journey!
                                            Thank you for choosing our service!
                                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~ @#@#@#@#@ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
                                          // Generate the QR CODE and send the booking confirmation email
                                          const qrCodeData = `http://192.168.1.41:4000/${bookingId}`;
                                          const qrCodeImage = 'ticket-QRCODE.png';
                                          await qrcode.toFile(qrCodeImage, qrCodeData);
                                      
                                          await sendBookingEmail(email, 'Your Booking has been confirmed', emailContent);
                                      
                                          res.status(200).json({
                                            success: true,
                                            message: 'Booking successful. Ticket sent to user email.',
                                          });
                                        } catch (error) {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: 'An error occurred',
                                          });
                                        }
                                      };
                                      
                                      // Function to calculate age group
                                      function calculateAgeGroup(age) {
                                        if (age > 0 && age <= 2) {
                                          return 'baby';
                                        } else if (age > 2 && age <= 21) {
                                          return 'children';
                                        } else {
                                          return 'adult';
                                        }
                                      }
                                                                      
                                                              
                              
                                          
                                  
// Api for cancle tickit 
                  
                                            const cancelTicket = async (req, res) => {
                                              try {                                              
                                                const { email, bookingId } = req.body;

                                                if (!email) {
                                                  return res.status(400).json({ success: false, message: 'Missing Email' });
                                                }
                                                if (!bookingId) {
                                                  return res.status(400).json({ success: false, message: 'Missing bookingId' });
                                                }

                                                const booking = await BookingModel.findOne({ bookingId });
                                                if (!booking) {
                                                  return res.status(404).json({ success: false, message: 'Booking not found' });
                                                }

                                                  // Fetch the user associated with the booking
                                                  const user = await UserModel.findById(booking.userId)

                                                  // check if the provided email matches the user email
                                                  if(user.email !== email)

                                                  {
                                                    return res.status(400).json({
                                                      success : false ,
                                                      message : 'Unauthorized: You are not allowed to cancel this booking with these email'
                                                    })
                                                  }
                                                   

                                                // Check if the booking status allows cancellation
                                                if (booking.status === 'cancelled') {
                                                  return res.status(400).json({ success: false, message : 'Booking already cancelled' });
                                                }

                                                // Get the trip details
                                                const trip = await TripModel.findById(booking.tripId);
                                                if (!trip) {
                                                  return res.status(400).json({ success: false, message : 'Trip not found' });
                                                }

                                               
                                                // Update the available seats and booked seats on the bus
                                                const { selectedSeatNumbers } = booking;

                                                for (const seat of selectedSeatNumbers) {
                                                  const index = trip.booked_seat.indexOf(seat);
                                                  if (index !== -1) {
                                                    trip.booked_seat.splice(index, 1);
                                                    trip.Available_seat.push(seat);
                                                  }
                                                }
                                                   // set the booking status to 'cancelled'
                                                   
                                                   booking.status = 'cancelled'
                                                   await booking.save()
                                                   await trip.save()   
                                                   
                                                   // send a cancellation email to user 
                                                const emailContent = `Dear ${user.fullName},\nYour booking with Booking ID ${booking.bookingId} has been canceled.\n\nThank you for using our service.`;
                                                await sendCancelEmail(user.email, 'Ticket Cancellation Confirmation', emailContent);

                                                res.status(200).json({ success: true, message: 'Ticket cancellation successful. Confirmation sent to user email.' });
                                              } catch (error) {
                                                console.error(error);
                                                return res.status(500).json({ success: false, message : 'An error occurred' });
                                              }
                                            };
                                                                              
                        
  // Api for get tickits booked by a user 

                                      const userTickets = async (req,res)=>{
                                        try{
                                          const userId = req.params.userId
                                          const status = req.query.status

                                          let tickets

                                          if(status === 'confirmed')
                                          {
                                            tickets = await BookingModel.find({ userId , status : 'confirmed'})
                                          }
                                          else if(status === 'panding' || status === 'cancelled')
                                          {
                                            tickets = await BookingModel.find({ userId , status : {$in: ['pending', 'cancelled']}})
                                          }
                                          else
                                          {
                                            return res.status(400).json({ success : false , message : 'Invalid Status Value' })
                                          }

                                          res.status(200).json({ success : true , message : "user Tickets" , tickets})
                                        }catch(error)
                                        {
                                          res.status(500).json({ success: false, message: 'Error finding tickets' });

                                        }
                                      }

  // APi for change trip Date 

                                            const getUpcomingTrip_for_DateChange = async (req, res) => {
                                              try {
                                                const currentDate = new Date();
                                                const sevenDaysFromNow = new Date(currentDate);
                                                sevenDaysFromNow.setDate(currentDate.getDate() + 7);
                                            
                                                // Aggregate trips and group them by routeId
                                                const aggregatedTrips = await TripModel.aggregate([
                                                  {
                                                    $match: {
                                                      startingDate: {
                                                        $gte: currentDate,
                                                        $lte: sevenDaysFromNow,
                                                      },
                                                    },
                                                  },
                                                  {
                                                    $group: {
                                                      _id: '$routeNumber',
                                                      trips: { $push: '$$ROOT' },
                                                      count: { $sum: 1 },
                                                    },
                                                  },
                                                  {
                                                    $match: {
                                                      count: { $gt: 1 },
                                                    },
                                                  },
                                                ]);
                                            
                                                // Extract the trips from the aggregation result
                                                const commonRouteNumberTrips = aggregatedTrips.map((group) => group.trips).flat();
                                            
                                                res.status(200).json({
                                                  success: true,
                                                  message: 'Select the trips for changing the Date',
                                                  trips: commonRouteNumberTrips,
                                                });
                                              } catch (error) {
                                                console.error('Error while fetching trips:', error);
                                                res.status(500).json({ success: false, message : 'There was an error while fetching trips' });
                                              }
                                            };
                                            
                                            
                                            
                          
      // change Trip

                                  const changeTrip = async (req, res) => {
                                    try {
                                      const { bookingId, newTripId } = req.body;
                                  
                                      // Validate required fields
                                      const requiredFields = ['bookingId', 'newTripId'];
                                      for (const field of requiredFields) {
                                        if (!req.body[field]) {
                                          return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                        }
                                      }
                                  
                                      // Find the booking by bookingId
                                      const booking = await BookingModel.findOne({ bookingId });
                                  
                                      if (!booking) {
                                        return res.status(404).json({ success: false, message : 'Booking not found' });
                                      }
                                  
                                      // Check if the trip has already been updated
                                      if (booking.tripUpdated) {
                                        return res.status(400).json({ success: false, message : 'Trip already updated once' });
                                      }
                                  
                                      const oldTripId = booking.tripId;
                                  
                                      // Find the old and new trips based on tripIds
                                      const oldTrip = await TripModel.findById(oldTripId);
                                  
                                      if (!oldTrip) {
                                        console.error(`Old Trip not found for ID: ${oldTripId}`);
                                        return res.status(404).json({ success: false, message : 'Old Trip not found' });
                                      }
                                  
                                      const newTrip = await TripModel.findById(newTripId);
                                  
                                      if (!newTrip) {
                                        console.error(`New Trip not found for ID: ${newTripId}`);
                                        return res.status(404).json({ success: false, message : 'New trip not found' });
                                      }
                                  
                                      if (!Array.isArray(booking.selectedSeatNumbers) || booking.selectedSeatNumbers.length !== booking.passengers.length) {
                                        return res.status(400).json({ success: false, message : 'Invalid selected seat number' });
                                      }
                                  
                                      // Check if oldTrip and oldTrip.booked_seat are defined and are arrays
                                      if (!oldTrip || !Array.isArray(oldTrip.booked_seat)) {
                                        return res.status(400).json({
                                          success : false,
                                          message : 'Invalid old trip data',
                                        });
                                      }
                                  
                                      // Transfer the selected seats from the old trip to the new trip's booked_seat and vice versa
                                      for (const seat of booking.selectedSeatNumbers) {
                                        const oldSeatIndex = oldTrip.booked_seat.indexOf(seat);
                                        const newSeatIndex = newTrip.Available_seat.indexOf(seat);
                                  
                                        if (oldSeatIndex !== -1) {
                                          oldTrip.booked_seat.splice(oldSeatIndex, 1);
                                          oldTrip.Available_seat.push(seat);
                                        }
                                  
                                        if (newSeatIndex !== -1) {
                                          newTrip.Available_seat.splice(newSeatIndex, 1);
                                          newTrip.booked_seat.push(seat);
                                        }
                                      }
                                  
                                      // Check if the same selectedSeatNumbers of the new trip are already booked in BookingModel
                                      const existingBooking = await BookingModel.findOne({
                                        tripId: newTripId,
                                        selectedSeatNumbers: { $in: booking.selectedSeatNumbers },
                                      });
                                  
                                      if (existingBooking) {
                                        // Assign different seat numbers to the user on the same bookingId
                                        const availableSeatsInNewTrip = newTrip.Available_seat;
                                        const newSelectedSeatNumbers = [];
                                  
                                        for (const seat of booking.selectedSeatNumbers) {
                                          if (availableSeatsInNewTrip.includes(seat)) {
                                            newSelectedSeatNumbers.push(seat);
                                            availableSeatsInNewTrip.splice(availableSeatsInNewTrip.indexOf(seat), 1);
                                          } else {
                                            // Find and assign a different seat
                                            const differentSeat = availableSeatsInNewTrip.shift();
                                            newSelectedSeatNumbers.push(differentSeat);
                                          }
                                        }
                                  
                                        // Update the selectedSeatNumbers and passengers of the existing booking
                                        existingBooking.selectedSeatNumbers = newSelectedSeatNumbers;
                                        // Update passengers accordingly
                                        for (let i = 0; i < booking.passengers.length; i++) {
                                          existingBooking.passengers[i].seat = newSelectedSeatNumbers[i];
                                        }
                                  
                                        // Save changes to the existing booking
                                        await existingBooking.save();
                                      }
                                  
                                      // Check if there are available seats in the new trip
                                      if (newTrip.Available_seat.length === 0) {
                                        return res.status(400).json({
                                          success: false,
                                          message: 'No available seats in the new trip. Please select another trip.',
                                        });
                                      }
                                  
                                      // Update the booking's tripId to the newTripId
                                      booking.tripId = newTripId;
                                      
                                      booking.date = newTrip.startingDate;
                                  
                                      // Mark the trip as updated
                                      booking.tripUpdated = true;
                                  
                                      // Save changes to the booking, oldTrip, and newTrip
                                      await Promise.all([booking.save(), oldTrip.save(), newTrip.save()]);
                                  
                                      return res.status(200).json({
                                        success: true,
                                        message: 'Trip changed successfully',
                                      });
                                    } catch (error) {
                                      console.error(error);
                                      return res.status(500).json({
                                        success: false,
                                        message : 'There is an error',
                                      });
                                    }
                                  };
                                  
                 
                                                      /* Booking Manage */
//Api for get all Bookings
                 
                  const allBookings = async (req, res) => {
                    try {
                      const {status} = req.query
                  
                      let bookings;                     
                     
                      if (status === 'confirmed') {
                        bookings = await BookingModel.find({ status: 'confirmed'  });
                      } else if (status === 'pending' || status ==='cancelled') {
                        bookings = await BookingModel.find({ status:  {$in:['pending','cancelled'] }});
                      }
                      else {
                        return res.status(400).json({ success: false, error: 'Invalid status value' });
                      }
                        
                      res.status(200).json({ success: true, message: `All ${status} Tickites`, All_Bookings : bookings });
                    } catch (error) {
                      
                      res.status(500).json({ success: false, error: 'There is an error to find Bookings '});
                    }
                  }
              
// Api for GET Bookings for a particular date and status

                      
                                              const countBookings = async (req, res) => {                          
                                                try {
                                                  const { status, startDate, endDate } = req.query;

                                                  if (!startDate || !endDate) {
                                                    return res.status(400).json({ success: false, message : 'Both start and end dates are required' });
                                                  }

                                                  let query = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };

                                                  if (status === 'confirmed') {
                                                    query.status = 'confirmed';
                                                  } else if (status === 'pending' || status === 'cancelled') {
                                                    query.status = { $in: ['pending', 'cancelled'] };
                                                  } else {
                                                    return res.status(400).json({ success: false, message : 'Invalid status value' });
                                                  }

                                                  const bookings = await BookingModel.find(query);

                                                  const count = bookings.length;

                                                  res.status(200).json({ success: true, message: `Count of ${status} bookings for date range ${startDate} to ${endDate}`, count, Bookings: bookings });
                                                } catch (error) {
                                                  res.status(500).json({ success: false, message : 'An error occurred while retrieving bookings' });
                                                }
                                              }

                            

    // API for TrackBus
      
                                        const trackBus = async (req, res) => {
                                          try {
                                            const { tripId } = req.params;
                                            const yourStopName = req.body.yourStopName;
                                        
                                            // Find the trip by Trip Id
                                            const trip = await TripModel.findById(tripId);
                                        
                                            if (!trip) {
                                              return res.status(404).json({ success: false, message : 'Trip not found' });
                                            }
                                        
                                            // Find the route in a trip using tripId
                                            const routeNumber = trip.routeNumber;
                                        
                                            const route = await BusRoute.findOne({ routeNumber });
                                            if (!route) {
                                              return res.status(404).json({ success: false, message : 'Route not found in trip' });
                                            }
                                        
                                            // Get the stops for the route
                                            const stops = route.stops || [];
                                        
                                            // Find the currentStop
                                            const currentStopIndex = stops.findIndex((stop) => stop.stopName === yourStopName);
                                        
                                            if (currentStopIndex === -1) {
                                              return res.status(400).json({ success: false, message : 'Your stop not found. Please enter a valid stop' });
                                            }
                                        
                                            const currentStop = stops[currentStopIndex];
                                            let previousStop = null;
                                        
                                            if (currentStopIndex > 0) {
                                              previousStop = stops[currentStopIndex - 1];
                                            }
                                        
                                            res.status(200).json({
                                              success: true,
                                              message: 'Bus Tracking Information',
                                              Bus_Tracking: {
                                                your_Stop: {
                                                  stopName: currentStop.stopName,
                                                  EstimatedTimeTaken: currentStop.EstimatedTimeTaken,
                                                },
                                                previousStop: previousStop
                                                  ? {
                                                      stopName: previousStop.stopName,                                                      
                                                    }
                                                  : null,
                                              },
                                            });
                                          } catch (error) {
                                            console.error(error);
                                            res.status(500).json({ success: false, message : 'There is an error tracking the bus' });
                                          }
                                        };
    
                              
   // send PUSH Notification
                                  
                                const sendUpcomingNotifications = async () => {
                                  try {
                                    const currentTime = new Date();
                                    const threeHoursLater = new Date(currentTime.getTime()  + 3 * 60 * 60 * 1000 )                                                                      
                                  
                                    const upcomingBookings = await BookingModel.find({
                                      'tripId.startingDate': {
                                        $gte: currentTime,
                                        $lte: threeHoursLater,
                                      },
                                    });                                    

                                    if (upcomingBookings.length === 0) {
                                      console.log('No upcoming bookings found');
                                      return;
                                    }
                                
                                    const registrationTokens = upcomingBookings.map((booking) => booking.userId);
                                
                                    const message = {
                                      notification: {
                                        title: 'Upcoming Journey Reminder',
                                        body: 'You have an upcoming journey.',
                                      },
                                      tokens: registrationTokens,
                                    };
                                
                                    // Send notifications to users with upcoming journeys
                                    const response = await FcmAdmin.messaging().sendMulticast(message);
                                
                                    // Save the responses in the database
                                    const chunkSize = 100;
                                    const chunkedResponse = _.chunk(response.responses, chunkSize);
                                
                                    for (let index = 0; index < chunkedResponse.length; index++) {
                                      const chunk = chunkedResponse[index];
                                      const docsToInsertInBulk = chunk.map((resp, idx) => ({
                                        userId: registrationTokens[index * chunkSize + idx],
                                        status: resp.success,
                                        messageId: resp.success ? resp.messageId : undefined,
                                      }));
                                
                                      await NotificationDetail.insertMany(docsToInsertInBulk);
                                    }
                                
                                    console.log('Notifications sent successfully');
                                  } catch (error) {
                                    console.error('Error sending notifications:', error);
                                  }
                                };
                                
                                // Schedule the job to run every hour
                                cron.schedule('0 * * * *', () => {
                                  sendUpcomingNotifications();
                                });
                                                                

                                            /* Manage Transaction */
          // Api for get All transaction
                        const All_Transaction = async (req, res) => {
                          try {
                            let startDate, endDate;
                        
                            // Check if startDate and endDate are present in the request query
                            if (req.query.startDate && req.query.endDate) {
                              startDate = new Date(req.query.startDate);
                              endDate = new Date(req.query.endDate);
                              endDate.setHours(23, 59, 59, 999);
                            }
                        
                            const query = {};
                        
                            if (startDate && endDate) {
                              query.createdAt = {
                                $gte: startDate,
                                $lte: endDate,
                              };
                            }
                        
                            const transactions = await TransactionModel.find(query);
                        
                            res.status(200).json({ success: true, message: 'All Transaction', transaction: transactions });
                          } catch (error) {
                            console.error('Error fetching transactions:', error);
                            res.status(500).json({ success: false, message : 'Internal server error' });
                          }
                        };
          
                                                      
                                        /* Import and Export Data  */
// APi for Import Buses record -
                            const import_Buses = async(req, res) =>{
                              try {
                                  const workbook = new ExcelJs.Workbook()
                                  await workbook.xlsx.readFile(req.file.path);

                                  const worksheet = workbook.getWorksheet(1)
                                  const busesData = []

                                  worksheet.eachRow((row , rowNumber)=>{
                                    if(rowNumber !== 1)
                                    {
                                          // skip the header row 

                                          const rowData = {
                                                  bus_type         : row.getCell(1).value,
                                                  seating_capacity : row.getCell(2).value,
                                                  bus_no           : row.getCell(3).value,
                                                  model            : row.getCell(4).value,
                                                  manufacture_year : row.getCell(5).value,
                                                  amenities        : row.getCell(6).value.split(',').map((item) => item.trim()),
                                                images             : row.getCell(7).value.split(',').map((item)=> item.trim()),
                                          }
                                            busesData.push(rowData)
                                    }
                                  })

                                          // insert the buses into the database

                                          const insertedBuses = await BusModel.insertMany(busesData)

                                          res.status(200).json({success : true , message : 'Buses imported successfully', buses : insertedBuses})
                              }
                              catch(error)
                              {
                                console.error(error);
                                res.status(500).json({ success : false , error : ' there is an error while importing Buses'})
                              }
                            } 
   
  
   // Api to create sample_buses
                             
                                        const generate_sampleFile = async (req, res) => {
                                          try {
                                            const workbook = new ExcelJs.Workbook();
                                            const worksheet = workbook.addWorksheet('Buses');                                        
                                          
                                            worksheet.addRow(['bus_type', 'seating_capacity', 'bus_no', 'model', 'manufacturing_year', 'amenities', 'images']);
                                        
                                            // Add sample data
                                            worksheet.addRow(['AC', 28, 'A11290', 'Ashok Leyland', 2018, 'wifi, AC, TV', 'image1.jpg']);
                                        
                                            // Set response headers for Excel download with the filename
                                            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                                            res.setHeader('Content-Disposition', 'attachment; filename=sample_Buses.xlsx'); 
                                        
                                            // Send the Excel file as a response
                                            await workbook.xlsx.write(res);
                                            res.end();
                                            console.log('Excel file sent');
                                          } catch (error) {
                                            console.error('Error sending Excel file:', error);
                                            res.status(500).send('Internal Server Error');
                                          }
                                        };

        // Api to export Bookings
                                                const export_Bookings = async (req, res) => {
                                                  try {
                                                    // Fetch all booking data from the booking Database
                                                    const bookings = await BookingModel.find({});
                                                
                                                    // Create Excel workbook and worksheet
                                                    const workbook = new ExcelJs.Workbook();
                                                    const worksheet = workbook.addWorksheet('Bookings');
                                                
                                                    // Define the Excel Header
                                                    worksheet.columns = [
                                                      { 
                                                        header: 'Booking ID', key: 'bookingId' 
                                                      },
                                                      {
                                                         header: 'User ID', key: 'userId'
                                                      },
                                                      {
                                                         header: 'Trip ID', key: 'tripId'
                                                      },
                                                      {
                                                         header: 'Journey Date', key: 'date'
                                                      },
                                                      {
                                                         header: 'Status', key: 'status' 
                                                      },
                                                      { 
                                                        header: 'Payment Status', key: 'paymentStatus' 
                                                      },
                                                      {
                                                         header: 'Total Fare', key: 'totalFare'
                                                      },
                                                    ];
                                                
                                                    // Add Booking data to the worksheet
                                                    bookings.forEach((booking) => {
                                                      worksheet.addRow({
                                                        bookingId: booking.bookingId,
                                                        userId: booking.userId,
                                                        tripId: booking.tripId,
                                                        date: booking.date,
                                                        status: booking.status,
                                                        paymentStatus: booking.paymentStatus,
                                                        totalFare: booking.totalFare,
                                                      });
                                                    });
                                                
                                                    // Set response headers for downloading the Excel file
                                                    res.setHeader(
                                                      'Content-Type',
                                                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                                    );
                                                
                                                    res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');
                                                
                                                    // Generate and send the Excel File as a response
                                                    await workbook.xlsx.write(res);
                                                
                                                    // End the response
                                                    res.end();
                                                  } catch (error) {
                                                    console.error(error);
                                                    res.status(500).json({ error: 'Internal server error' });
                                                  }
                                                };


        // Api for Export Transactions 
                                                  const export_Transactions = async (req, res) => {
                                                    try {
                                                      // Fetch all transaction data from the transaction Database
                                                      const transactions = await TransactionModel.find({});
                                                  
                                                      // Create Excel workbook and worksheet
                                                      const workbook = new ExcelJs.Workbook();
                                                      const worksheet = workbook.addWorksheet('Transactions');
                                                  
                                                      // Define the Excel Header
                                                      worksheet.columns = [
                                                        {
                                                           header: 'Booking ID', key: 'bookingId'
                                                        },
                                                        {
                                                           header: 'PaymentIntent ID', key: 'paymentIntentId'
                                                        },
                                                        { 
                                                          header: 'Amount', key: 'amount' 
                                                        },
                                                        {
                                                           header: 'Payment Status', key: 'status' 
                                                        },
                                                      ];
                                                  
                                                      // Add transaction data to the worksheet
                                                      transactions.forEach((transaction) => {
                                                        worksheet.addRow({
                                                          bookingId: transaction.bookingId,
                                                          paymentIntentId: transaction.paymentIntentId,
                                                          amount: transaction.amount,
                                                          status: transaction.status,
                                                        });
                                                      });
                                                  
                                                      // Set response headers for downloading the Excel file
                                                      res.setHeader(
                                                        'Content-Type',
                                                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                                      );
                                                  
                                                      res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
                                                  
                                                      // Generate and send the Excel File as a response
                                                      await workbook.xlsx.write(res);
                                                  
                                                      // End the response
                                                      res.end();
                                                    } catch (error) {
                                                      console.error(error);
                                                      res.status(500).json({ error: 'Internal server error' });
                                                    }
                                                  };
        
        // Api for export trips 
                                                const export_Trips = async (req, res) => {
                                                  try {
                                                    // Fetch all trips data from the Trip Database
                                                    const trips = await TripModel.find({});
                                                
                                                    // Create Excel workbook and worksheet
                                                    const workbook = new ExcelJs.Workbook();
                                                    const worksheet = workbook.addWorksheet('Trips');
                                                
                                                    // Define the Excel Header
                                                    worksheet.columns = [
                                                      {
                                                        header: 'Trip Number', key: 'tripNumber'
                                                      },
                                                      {
                                                        header: 'Starting Date', key: 'startingDate'
                                                      },
                                                      { 
                                                        header: 'End Date', key: 'endDate' 
                                                      },
                                                      {
                                                        header: 'Bus no ', key: 'bus_no' 
                                                      },
                                                      {
                                                        header: 'Driver Id', key: 'driverId'
                                                      },
                                                      {
                                                        header: 'Route Number', key: 'routeNumber'
                                                      },
                                                      { 
                                                        header: 'Source', key: 'source' 
                                                      },
                                                      {
                                                        header: 'Destination', key: 'destination' 
                                                      },
                                                      {
                                                        header: 'Starting Time', key: 'startingTime'
                                                      },
                                                      {
                                                        header: 'Status', key: 'status'
                                                      },
                                                      { 
                                                        header: 'Available_seat', key: 'Available_seat' 
                                                      },
                                                      {
                                                        header: 'Booked_seat', key: 'booked_seat' 
                                                      },
                                                      {
                                                        header: 'Bus Type', key: 'bus_type'
                                                      },
                                                      { 
                                                        header: 'Amenities', key: 'amenities' 
                                                      },
                                                      {
                                                        header: 'Bus Images', key: 'images' 
                                                      },
                                                    ];
                                                
                                                    // Add trips data to the worksheet
                                                    trips.forEach((trip) => {
                                                      worksheet.addRow({
                                                        tripNumber : trip.tripNumber,
                                                        startingDate : trip.startingDate,
                                                        endDate : trip.endDate,
                                                        bus_no : trip.bus_no,
                                                        driverId : trip.driverId,
                                                        routeNumber : trip.routeNumber,
                                                        source : trip.source,
                                                        destination : trip.destination,
                                                        startingTime : trip.startingTime,
                                                        status : trip.status,
                                                        Available_seat : trip.Available_seat,
                                                        booked_seat : trip.booked_seat,
                                                        bus_type : trip.bus_type,
                                                        amenities : trip.amenities,
                                                        images : trip.images,

                                                      });
                                                    });
                                                
                                                    // Set response headers for downloading the Excel file
                                                    res.setHeader(
                                                      'Content-Type',
                                                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                                    );
                                                
                                                    res.setHeader('Content-Disposition', 'attachment; filename=trips.xlsx');
                                                
                                                    // Generate and send the Excel File as a response
                                                    await workbook.xlsx.write(res);
                                                
                                                    // End the response
                                                    res.end();
                                                  } catch (error) {
                                                    console.error(error);
                                                    res.status(500).json({ error: 'Internal server error' });
                                                  }
                                                };

        
 // Api for Export User Data
                                            const export_Users = async (req, res) => {
                                              try {
                                                // Fetch all users data from the users Database
                                                const users = await UserModel.find({});

                                                // Create Excel workbook and worksheet
                                                const workbook = new ExcelJs.Workbook();
                                                const worksheet = workbook.addWorksheet('Users');

                                                // Define the Excel Header
                                                worksheet.columns = [
                                                  {
                                                    header: 'Full Name', key: 'fullname'
                                                  },
                                                  {
                                                    header: 'Email', key: 'email' 
                                                  },
                                                  {
                                                    header: 'Phone No', key: 'phone_no'
                                                  },
                                                  {
                                                    header: 'Age', key: 'age'
                                                  },
                                                  {
                                                    header: 'Gender', key: 'gender'
                                                  },
                                                  {
                                                    header: 'Profile Image', key: 'profileImage' 
                                                  }
                                                ];

                                                // Add users' data to the worksheet
                                                users.forEach((user) => {
                                                  worksheet.addRow({
                                                    fullname: user.fullName,
                                                    email: user.email, 
                                                    phone_no: user.phone_no,
                                                    age: user.age,
                                                    gender: user.gender,
                                                    profileImage: user.profileImage
                                                  });
                                                });

                                                // Set response headers for downloading the Excel file
                                                res.setHeader(
                                                  'Content-Type',
                                                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                                );

                                                res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

                                                // Generate and send the Excel File as a response
                                                await workbook.xlsx.write(res);

                                                // End the response
                                                res.end();
                                              } catch (error) {
                                                console.error(error);
                                                res.status(500).json({ error: 'Internal server error' });
                                              }
                                            };
              // APi for get all users 
                                      const allUsers = async (req, res) => {
                                        try {
                                          const users = await UserModel.find(); 
                                      
                                          res.status(200).json({ success : true , message : ' all users : ' , all_users : users }); 
                                          
                                        }
                                        catch(error)
                                        {
                                          res.status(500).json({ success : false , error: 'Error while finding the users' });
                                        }
                                      }

                                                                           


                                    
                                            
                

                    
    
                
    module.exports = { 
                        adminLogin , googleLogin , changePassword, addBus , updateBus ,
                        deleteBus, allBuses ,getBus, addRoute , allroutes , editRoute,addStop_in_Route,
                        editStop_in_Route, addStopBeforeStop, deleteStop_in_Route,  deleteRoute ,
                         searchTrips , createStop ,  addStopBeforeStop, allStops ,
                         deleteStop , changeProfile , addDriver ,editDriver,
                         deleteDriver , allDrivers ,getDriver , createTrip, allTrips , bookTicket, cancelTicket,
                          userTickets , getUpcomingTrip_for_DateChange , changeTrip , allBookings,countBookings , viewSeats ,
                          calculateFareForSelectedSeats , trackBus  , sendUpcomingNotifications , All_Transaction,
                          import_Buses , generate_sampleFile ,export_Bookings , export_Transactions , export_Trips,
                          export_Users , allUsers



                         
                      }
                       
                    