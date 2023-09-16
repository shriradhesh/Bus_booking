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
const upload = require('../uploadImage')
const BusRoute = require('../models/bus_routes')
const DriverModel = require('../models/driverModel')
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


const accountSid = 'ACea0cb782d52a715846acedc254632e9e';
const authToken = '9920e53cb0ddef7283f32ec3a392e531';
const twilioPhoneNumber ='+16205914136';
const client = new twilio(accountSid , authToken)



                      /* -->  ADMIN Api'S   <--    */

//admin login API                           // UserName : Admin , Password : A1bcd2@12
    
                        const adminLogin = async (req, res) => {
                            try {
                                const { username, password } = req.body;
                                    
                                // Find Admin by username
                                const admin = await Admin.findOne({ username });
                                    
                                if (!admin) {
                                    
                                    return res.status(400).json({ message: 'Username incorrect ', success: false });
                                }          
                          
                                // Compare passwords using bcrypt
                                const passwordMatch = await bcrypt.compare(password, admin.password);
                            
                                if (passwordMatch) {
                                    return res.json({ message: 'Admin Login Successfull', success: true , Data : admin });
                                } else {
                                    return res.status(400).json({ message: 'Password incorrect', success: false });
                                }
                            } catch (error) {
                                console.error(error);
                                res.status(500).json({ message: 'Internal server error' });
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
                          return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                      }
                  }
                                
                      

                    // check for password match                     
                      
                      if( newPassword !== confirmPassword )
                      {
                        return res.status(400).json({ error : 'Password do not match' , success : false})
                      }

                       // find Admin by Id
                       
                       const admin = await Admin.findOne({_id:id})
                        
                       if(!admin){
                 
                        return res.status(404).json({ error : ' Admin not found' , success : false})
                       }
                       else
                       {
                                               
                         // check if old password match with stored password
                         
                         const isOldPasswordValid = await bcrypt.compare(oldPassword , admin.password)
                            if(!isOldPasswordValid)
                            {
                                return res.status(400).json({ error : 'Old Password incorrect ', success : false})
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
                              return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                          }
                      }
                          
                        // Check for bus number
                        const existBus = await BusModel.findOne({ bus_no });
                    
                        if (existBus) {
                          return res.status(400).json({ error: 'Bus with the same Number is Already Exist', success: false });
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
                          

                            const requiredFields = [
                                'bus_type',
                                'seating_capacity',            
                                'model',
                                'manufacture_year',
                                'amenities',            
                                'status',
                                'availability',
                              
                            ];

                            for (const field of requiredFields) {
                                if (!req.body[field]) {
                                    return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                }
                            }

                            const existBus = await BusModel.findOne({ _id:id });
                            if (!existBus) {
                                return res.status(400).json({ error: 'Bus Not found', success: false });
                            }

                            const validStatus = ['active', 'inactive'];
                            const driverStatus = validStatus.includes(status) ? status : 'active';

                            const validAvailability = ['available', 'unavailable', 'booked'];
                            const BusAvailability = validAvailability.includes(availability) ? availability : 'available';
                                 

                            existBus.bus_type = bus_type;
                            existBus.seating_capacity = seating_capacity;    
                            existBus.Available_seat = availableSeat;   
                            existBus.model = model;
                            existBus.manufacture_year = manufacture_year;
                            existBus.amenities = amenities;       
                            existBus.status = driverStatus;
                            existBus.availability = BusAvailability;
                          

                            if (req.file) {
                                if (existBus.images) {
                                    try {
                                        fs.unlinkSync(existBus.images);
                                    } catch (error) {
                                        console.error('Error deleting previous image:', error);
                                    }
                                }
                                existBus.images = req.file.path;
                            }

                            const updatedBus = await existBus.save();
                            res.status(200).json({ success: true, message: 'Bus Details Edit Successfully' });
                        } catch (error) {
                            console.error(error);
                            res.status(500).json({ success: false, error: 'Error while editing the bus details' });
                        }
                    };

  //APi for delete Bus 
               
                  const deleteBus = async (req, res) => {
                    try {
                        const busId = req.params.busId;
                        const bus = await BusModel.findById(busId);

                        if (!bus) {
                            return res.status(404).json({ success: false, error: 'Bus not found' });
                        }

                        if (bus.status === 'inactive' && bus.availability === 'unavailable') {
                            // Check if the bus is booked on other routes
                            const routesWithBus = await BusRoute.find({ busId: busId });
                            if (routesWithBus.length > 0) {
                                return res.status(400).json({ success: false, error: 'Bus is booked on other routes' });
                            }

                            // If not booked on other routes, delete the bus
                            await BusModel.deleteOne({ _id: busId });
                            res.status(200).json({ success: true, message: 'Bus deleted successfully' });
                        } else {
                            res.status(400).json({ success: false, error: 'Bus cannot be deleted , its currently status : active & Avaialabilty : available ' });
                        }
                    } catch (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Error while deleting the Bus' });
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
                      return res.status(400).json({ success: false, error: 'Invalid status value' });
                    }
                      
                    res.status(200).json({ success: true, message: 'All Buses', Bus_Detail: buses });
                  } catch (error) {
                    console.error(error);
                    res.status(500).json({ success: false, error: 'There is an error to find Buses' });
                  }
                }
            
// Api for Get a Route details by Route id
                const getBus = async (req, res) => {
                  try {
                    const busId = req.params.busId;
                    const bus = await BusModel.findById(busId);

                    if (!bus) {
                      return res.status(404).json({success : false ,  error: 'BUS not found' });
                    }

                    res.status(200).json({ success : true , message : " BUS found" , Bus_Detail : bus });
                  } catch (err) {
                    res.status(500).json({ success : false , error: 'Error while finding the BUS' });
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
                                return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                            }
                        } 
                        
                        // Check for stopName
                        const existStop = await stopModel.findOne({ stopName });
                                  
                        if (existStop) {
                          return res.status(400).json({ error: ' StopName already exist ', success: false });
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
                            
                            res.status(500).json({ success: false, error: 'There is an error to find all Stops ' });
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
                            res.status(500).json({ success: false, error: 'Error while deleting the Stop' });
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
                                      return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                  }
                              }
                                
                                // check for route existance 
                          const existRoute = await BusRoute.findOne({ routeNumber })
                              if(existRoute)
                              {
                            return res.status(400).json({ success : false ,  error : `route already exit with the route number : ${routeNumber} `})
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
                          return res.status(500).json({ success: false, error: 'An error occurred while add route' });
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
                        res.status(500).json({success : false, error: 'There is an error to find Routes' + error.message});
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
                                        return res.status(404).json({ success: false, error: `Route not found` });
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
                                    res.status(500).json({ success: false, error: 'Error while editing the route details' });
                                }
                              };

     //API for add stop in a bus with bus id 

                            const addStop_in_Route = async (req,res)=>{
                                  
                              const routeId = req.params.routeId
                            const {stopName ,arrivalTime, departureTime, distance} = req.body          
                              
                            try{

                              const requiredFields = [                
                                'stopName', 
                                'arrivalTime',
                                'departureTime',                                            
                                'distance'          
                        
                            ];

                            for (const field of requiredFields) {
                                if (!req.body[field]) {
                                    return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                }
                            }
                                        
                                  const route = await BusRoute.findOne({ _id:routeId })
                            
                                  if(!route)
                                  {
                                      return res.status(400).json({ success : false , error : `route not found with the BusId ${routeId}`})
                                  }
                                         // Check if the stopName exists in the StopModel
                                    const existingStop = await stopModel.findOne({ stopName });

                                    if (!existingStop) {
                                      return res.status(400).json({ success: false, error: `Stop '${stopName}' does not exist in stops Database` });
                                    }
                                   //  stops is an array in the BusRoute model
                                    const duplicateStop = route.stops.find((stop) => stop.stopName === stopName);

                                    if (duplicateStop) {
                                      return res.status(400).json({ success: false, error: `Stop '${stopName}' already exists in a route` });
                                    }
                                  route.stops.push({
                                      stopName, 
                                      arrivalTime,
                                      departureTime,                                     
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
                        
                              const editStop_in_Route = async (req, res) =>{
                                let routeId
                                try{
                                    const stopId = req.params.stopId
                                    routeId = req.params.routeId          
                                    
                                    const {
                                      arrivalTime,
                                      departureTime,
                                      distance
                                    } = req.body                       
                                    
                        
                                          // check for route existance
                                        const existRoute = await BusRoute.findOne({_id:routeId})
                                        if(!existRoute)
                                        {
                                          return res.status(404).json({ success: false , error : " Route not found "})
                                        }

                                            // Check if the stops array exists within existRoute
                                              if (!existRoute.stops || !Array.isArray(existRoute.stops)) {
                                                return res.status(404).json({ success: false, error: "Stops not found in the route" });
                                            }
                                            
                                            // check for stopIndex
                                        const existStopIndex = existRoute.stops.findIndex(stop => stop._id.toString() === stopId)                     
                                          if(!existStopIndex === -1)
                                          {
                                            return res.status(404).json({ success : false , error : "stop not found"})
                                          }
                                          // Update the properties of the stop
                                            existRoute.stops[existStopIndex].arrivalTime = arrivalTime;
                                            existRoute.stops[existStopIndex].departureTime = departureTime;
                                            existRoute.stops[existStopIndex].distance = distance;

                                            // Save the updated route back to the database
                                            await existRoute.save();

                                                    
                                              res.status(200).json({ success : true , message :` stop is edit successfully for routeId : ${routeId}`})
                                              
                                      }        
                                catch(error)
                                {
                                    console.error(error);
                                  res.status(500).json({success: false , error : ` there is an error to update the stop in routeId : ${routeId}`})
                                }
                                }
                                        
    

        
      // Api to add stop before the stop in a route
                      const addStopBeforeStop = async (req, res) => {
                        const routeId = req.params.routeId;
                        const { beforeStopName, stopName, arrivalTime, departureTime , distance } = req.body;
                    
                        try {
                            const requiredFields = [
                                'beforeStopName',
                                'stopName',   
                                'arrivalTime',
                                'departureTime',                             
                                'distance'
                            ];
                    
                            for (const field of requiredFields) {
                                if (!req.body[field]) {
                                    return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                }
                            }
                    
                            const route = await BusRoute.findOne({ _id: routeId });
                    
                            if (!route) {
                                return res.status(400).json({ success: false, error: `route not found with the route ID ${routeId}` });
                            }
                            
                                 // Check if the stopName exists in the StopModel
                                 const existingStop = await stopModel.findOne({ stopName });

                               if (!existingStop) {
                                  return res.status(400).json({ success: false, error: `Stop '${stopName}' does not exist in stops Database` });
                                  }
                    
                            const beforeStopIndex = route.stops.findIndex(stop => stop.stopName === beforeStopName);
                    
                            if (beforeStopIndex === -1) {
                                return res.status(400).json({ success: false, error: `Stop '${beforeStopName}' not found on the route` });
                            }
                    
                            const newStop = {
                              stopName, 
                              arrivalTime,
                              departureTime,                                     
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
                                return res.status(404).json({ success : false , error : " Route not found"})
                              }
                              
                              // check for stop
                              const existStopIndex = existRoute.stops.findIndex(stop => stop._id.toString() === stopId)
                                if(existStopIndex === -1)
                                {
                                  return res.status(404).json({ success : false , error : " Stop not found"})
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
                              res.status(500).json({ success : false , error :  ` there is an error to delete the stop `})
                        }
                        }         




    // Api for delete Route 
                        const deleteRoute = async (req, res) => {
                          try {
                            const routeId = req.params.routeId;
                        
                            // Check for route existence
                            const existingRoute = await BusRoute.findOne({ _id: routeId });
                            if (!existingRoute) {
                              return res.status(404).json({ success: false, error: `Route not found` });
                            }
                        
                            // Delete the route from the database
                            await existingRoute.deleteOne();
                            
                            res.status(200).json({ success: true, message: 'Route deleted successfully' });
                          } catch (error) {
                            console.error(error);
                            res.status(500).json({ success: false, error: 'Error while deleting the route' });
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
                  return res.status(404).json({ success : false , error : 'Admin not found'})
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
                  
                  res.status(500).json({ success : false , error : ' Error while changing Admin profile'})
                }
              }

                                                    /*   Driver Manage  */

  //Api for add New Driver
              const addDriver = async (req, res) => {
                try {
                  const { driverName, driverContact, driverLicence_number, status  } = req.body;

                  const requiredFields = [                
              'driverName',
              'driverContact',            
              'driverLicence_number',             
              'status'            
              
          ];
      
          for (const field of requiredFields) {
              if (!req.body[field]) {
                  return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
              }
          }               
              
                  // Check for driver existence
                  const existingDriver = await DriverModel.findOne({ driverLicence_number });
                  if (existingDriver) {
                    return res.status(400).json({ success: false, error: ' License Number already exists' });
                  }
              
                  // Check for valid driver status
                  const validStatus = ['active', 'inactive'];
                  const driverStatus = validStatus.includes(status) ? status : 'active';

                 
                  const newDriver = new DriverModel({
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
                  res.status(500).json({ success: false, error: 'Error adding driver details' });
                }
              };
        
      // Api for edit Driver Details
                     const editDriver = async(req, res) =>{
                      try{
                            const driverId = req.params.driverId
                            const {
                              driverName ,
                              driverContact,
                              status , 
                             availability 
                              
                            } = req.body
                            const requiredFields = [                
                              'driverName',
                              'driverContact',            
                              'driverLicence_number',             
                              'status'            
                              
                          ];
                      
                          for (const field of requiredFields) {
                              if (!req.body[field]) {
                                  return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                              }
                          }           
                                  
                                
                             // Check for driver existence
                            const existingDriver = await DriverModel.findOne({ _id:driverId});
                            if (!existingDriver) {
                              return res.status(400).json({ success: false, error: 'Driver not found' });
                            }
                             // Check for valid driver status
                        const validStatus = ['active', 'inactive'];
                        const driverStatus = validStatus.includes(status) ? status : 'active';
                              // check for valid availability status
                        const validAvailability = ['available', 'unavailable', 'booked'];
                        const driverAvailability = validAvailability.includes(availability) ? availability : 'available';
                

                                    // update the Driver properties
                              existingDriver.driverName = driverName,
                              existingDriver.driverContact = driverContact,
                              existingDriver.status = driverStatus
                              existingDriver.availability = driverAvailability;
                              
                                      //update driver profileImage  
                                                    
                       if(req.file)
                       {
                         existingDriver.driverProfileImage = req.file.filename
                      
                       }  

                              // save the data into database
                              const updateDriver = await existingDriver.save()
                              res.status(200).json({ success : true , message : ' Driver details update successfully' , Driver : updateDriver})

                      }catch(error)
                     
                      {
                        console.error(error);
                          
                          res.status(500).json({ success : false , error : ' there is an error to update the details of the driver'})
                      }
                     } 
  
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
                              res.status(400).json({ success: false, error: 'Driver booked with other bus and route ' });
                            }
                            }
                            catch (error) {                    
                                res.status(500).json({ error: 'Error while deleting the Driver' });
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
                                  return res.status(400).json({ success: false, error: 'Invalid status value' });
                                }
                                  
                                res.status(200).json({ success: true, message: 'All Drivers', Driver_Details: Drivers });
                              } catch (error) {
                                
                                res.status(500).json({ success: false, error: 'There is an error to find Drivers' });
                              }
                            }
               
    // Api for Get a driver details by driver id
                              const getDriver = async (req, res) => {
                                try {
                                  const driverId = req.params.driverId;
                                  const driver = await DriverModel.findById(driverId);

                                  if (!driver) {
                                    return res.status(404).json({success : false ,  error: 'Driver not found' });
                                  }

                                  res.status(200).json({ success : true , message : " driver found" , Driver_Details : driver });
                                } catch (err) {
                                  res.status(500).json({ success : false , error: 'Error while finding the driver' });
                                }
                              }


                                                        /* TRIP Management */


//API for create a new trip
                    const createTrip = async(req,res) =>{
                      try{
                        const {
                          tripNumber,
                          busId,
                          driverId,
                          routeId,
                          startingDate,
                          endDate,
                          scheduled_ArrivalTime,
                          scheduled_DepartureTime,
                          status
                         
                        } = req.body

                        const requiredFields = [
                          'busId',
                          'driverId',
                          'routeId',
                          'startingDate',
                          'endDate'                         

                        ]
                        for(const field of requiredFields){
                          if(!req.body[field]){
                            return res.status(400).json({ error : `missing ${field.replace('_',' ')} field`, success : false})
                          }
                        }
                           // Check if a trip with the same busId and startingDate already exists
                                const existingbus = await TripModel.findOne({
                                  busId,
                                  startingDate,
                                });
                                    
                                if (existingbus) {
                                  return res
                                    .status(400)
                                    .json({
                                      error: 'A trip with the same Bus and starting date already exists',
                                      success: false,
                                    });
                                }
                                
                           // Check if a trip with the same routeId and startingDate already exists
                                const existingRoute = await TripModel.findOne({
                                  routeId,
                                  startingDate,
                                });

                                if (existingRoute) {
                                  return res
                                    .status(400)
                                    .json({
                                      error: 'A trip with the same Route and starting date already exists',
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
                                      error: 'A trip with the same Driver and starting date already exists',
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
                                                    error : ' trip number already exist',
                                                    success : false
                                        })
                                      }

                        // Check for bus number
                        const bus = await BusModel.findOne({ _id:busId });
                    
                        if (!bus) {
                          return res.status(400).json({ error: 'Bus not found ', success: false });
                        }
                           
                        // Check for Route number
                        const route = await BusRoute.findOne({ _id:routeId });
                    
                        if (!route) {
                          return res.status(400).json({ error: 'Route not found', success: false });
                        }
                          // Check for Driver existence
                          const driver = await DriverModel.findOne({ _id:driverId })

                          if (!driver) {
                            return res.status(400).json({ error: 'Driver with the specified ID does not exist', success: false });
                          }   
                          
                              // Create an array for available seats
                    const busCapacity = bus.seating_capacity;
                    const Available_seat = Array.from({ length: busCapacity }, (_, index) => index + 1);
                          
                            const newTrip = new TripModel({
                              tripNumber,
                              startingDate,
                              endDate,
                              busId,
                              driverId,
                              routeId,
                              scheduled_ArrivalTime,
                              scheduled_DepartureTime,                             
                              status,
                              Available_seat
                            })

                            const savedTrip = await newTrip.save()
                            res.status(200).json({ success : true , message : 'new trip created successfully', Trip_Detail : savedTrip})

                      }
                      catch(error)
                      {
                            res.status(500).json({success : false , error : ' there is an error while creating the trip'})
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
                                     
      // Api for searchtrips    
                              const searchTrips = async (req, res) => {
                                try {
                                  const { sourceStop, destinationStop, date } = req.body;
                              
                                  // Aggregate trips based on the specified criteria
                                  const matchingTrips = await TripModel.aggregate([
                                    {
                                      $match: {
                                        startingDate: new Date(date), 
                                      },
                                    },
                                    {
                                      $lookup: {
                                        from: 'busroutes', 
                                        localField: 'routeId',
                                        foreignField: '_id',
                                        as: 'route',
                                      },
                                    },
                                    {
                                      $match: {
                                        'route.stops.stopName': { $all: [sourceStop, destinationStop] },
                                      },
                                    },
                                    {
                                      $project: {
                                        tripId: '$_id',
                                        source: sourceStop,
                                        destination: destinationStop,
                                        status: 1, 
                                        stops: '$route.stops',
                                      },
                                    },
                                  ]);
                              
                                  if (!matchingTrips || matchingTrips.length === 0) {
                                    return res.status(404).json({ success: false, error: 'No matching trips found' });
                                  }

                                  // Return the matching trips along with sourceStop and destinationStop
                                  res.status(200).json({ success: true, message: 'Trips for the route', trip_Details: matchingTrips });
                                } catch (error) {
                                  console.error(error);
                                  res.status(500).json({ success: false, error: 'Error while fetching the data' });
                                }
                              };

 // API for View seats in Bus for a trip
                            
                                    const viewSeats = async (req, res) => {
                                      try {
                                        const tripId = req.params.tripId;                                        

                                        // Find the trip by its ID
                                        const trip = await TripModel.findById(tripId);

                                        if (!trip) {
                                          return res.status(404).json({ success: false, error: 'Trip not found' });
                                        } 
                                          // Initialize availableSeats with the trip's available seats

                                          let availableSeats = trip.Available_seat || []
                                       

                                          // Initialize bookedSeats with the trip's booked seats
                                        let bookedSeats = trip.booked_seat || [];

                                        // Check for bookings on the given date and bus ID within the trip's date range
                                        const bookingsOnDate = await BookingModel.find({
                                          tripId,                                          
                                          status: 'confirmed',
                                        });
                                       
                                        // If there are bookings on the given trip, update bookedSeats and availableSeats
                                          if (bookingsOnDate.length > 0) {
                                            bookedSeats = [].concat(...bookingsOnDate.map((booking) => booking.selectedSeatNumbers));
                                            availableSeats = availableSeats.filter((seat) => !bookedSeats.includes(seat));
                                          }
                                       
                                        res.status(200).json({
                                          success: true,
                                          message: 'Seat information in a Trip for the Bus',
                                          tripId : tripId,
                                          Seat_Info: {                                           
                                            availableSeats,
                                            bookedSeats,
                                          },
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
                                      const { selectedSeatNumbers } = req.body;
                                      const { sourceStop, destinationStop } = req.query;

                                      // Find the trip by its ID
                                      const trip = await TripModel.findById(tripId);

                                      if (!trip) {
                                        return res.status(404).json({ success: false, error: 'Trip not found' });
                                      }

                                      // Input Validation for selected seat numbers
                                      if (!Array.isArray(selectedSeatNumbers) || selectedSeatNumbers.length === 0) {
                                        return res.status(400).json({ error: 'Invalid or empty selected seat numbers', success: false });
                                      }

                                      // Access the available seats from the trip
                                      const availableSeats = trip.Available_seat || [];

                                      // Check if selected bus seats are valid and available
                                      const invalidSeatNumbers = selectedSeatNumbers.filter((seatNumber) => !availableSeats.includes(seatNumber));

                                      if (invalidSeatNumbers.length > 0) {
                                        return res.status(400).json({
                                          success: false,
                                          error: 'Selected seat numbers are invalid or not available',
                                          invalidSeatNumbers,
                                        });
                                      }

                                      // Access the route and stops from the trip
                                      const routeId = trip.routeId;
                                      const route = await BusRoute.findById(routeId);

                                      if (!route) {
                                        return res.status(400).json({
                                          success: false,
                                          error: 'Route not found',
                                        });
                                      }

                                      const stops = route.stops || [];

                                      // Calculate the distance between source and destination stops
                                      const distance = calculateDistanceBetweenStops(stops, sourceStop, destinationStop);

                                      // Check the bus type and set farePerUnitDistance accordingly
                                      let farePerUnitDistance;
                                          const busId = trip.busId
                                      
                                      const bus = await BusModel.findById(busId)
                                      if(!bus)
                                      {
                                        return res.status(400).json({success : false ,
                                                                     error : "Bus not found in trip"
                                      })
                                      }

                                      switch (bus.bus_type) {
                                        case 'Non-AC':
                                          farePerUnitDistance = 0.2;
                                          break;
                                        case 'AC':
                                          farePerUnitDistance = 0.24;
                                          break;
                                        case 'luxury':
                                          farePerUnitDistance = 0.3;
                                          break;
                                        default:
                                          farePerUnitDistance = 0.2;
                                      }

                                      // Calculate the total fare for selected seats
                                      const totalFare = selectedSeatNumbers.length * distance * farePerUnitDistance;

                                      return res.status(200).json({
                                        success: true,
                                        message: 'Fare calculated successfully',
                                        busType: bus.bus_type,
                                        boardingPoint: sourceStop,
                                        droppingPoint: destinationStop,
                                        seatNumber: selectedSeatNumbers,
                                        totalFare_in_Euro: totalFare,
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



                                             /*  Manage Tickit */



    // api for book tickit               
       
                                      const bookTicket = async (req, res) => {
                                        try {
                                          const {
                                            tripId,
                                            date,
                                            selectedSeatNumbers,
                                            status,
                                            email,
                                            passengers,
                                            totalFare_in_Euro
                                          } = req.body;
                                      
                                          const {
                                            source,
                                            destination
                                          } = req.query;
                                      
                                          // Checking for required fields in the request
                                          const requiredFields = [
                                            'tripId',
                                            'email',
                                            'totalFare_in_Euro',
                                            'passengers'
                                          ];
                                          for (const field of requiredFields) {
                                            if (!req.body[field]) {
                                              return res.status(400).json({
                                                error: `Missing ${field.replace('_', ' ')} field`,
                                                success: false
                                              });
                                            }
                                          }
                                      
                                          // Fetching user details
                                          const user = await UserModel.findOne({
                                            email
                                          });
                                          if (!user) {
                                            return res.status(400).json({
                                              success: false,
                                              error: 'User not found'
                                            });
                                          }
                                          const userId = user._id;
                                      
                                          // Fetch trip and check if it exists
                                          const trip = await TripModel.findById(tripId)
                                      
                                          if (!trip) {
                                            return res.status(400).json({
                                              success: false,
                                              error: 'Trip not found'
                                            });
                                          }
                                      
                                          const busId = trip.busId;
                                      
                                          if (!busId) {
                                            return res.status(400).json({
                                              success: false,
                                              error: 'busId not found'
                                            });
                                          }
                                      
                                          const bus = await BusModel.findById(busId);
                                          if (!bus) {
                                            return res.status(400).json({
                                              success: false,
                                              error: 'Bus Details not found'
                                            });
                                          }
                                      
                                          const driverId = trip.driverId
                                          const Driver = await DriverModel.findById(driverId)
                                      
                                          if (!Driver) {
                                            return res.status(400).json({
                                              success: false,
                                              error: 'Driver not found'
                                            });
                                          }
                                      
                                          if (!Array.isArray(selectedSeatNumbers) || selectedSeatNumbers.length !== passengers.length) {
                                            return res.status(400).json({
                                              success: false,
                                              error: 'Invalid selected seat numbers'
                                            });
                                          }
                                      
                                          // Check if selected seat is already booked in a Bus
                                          const bookedSeats = trip.booked_seat || [];
                                      
                                          for (const seat of selectedSeatNumbers) {
                                            if (bookedSeats.includes(seat)) {
                                              return res.status(400).json({
                                                success: false,
                                                error: `Seat ${seat} is already booked`
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
                                            selectedSeatNumbers: {
                                              $in: selectedSeatNumbers
                                            },
                                          });
                                      
                                          if (existingBookings.length > 0) {
                                            // Some selected seats are already booked for the same trip and date
                                            const bookedSeatNumbers = existingBookings.map((booking) =>
                                              booking.selectedSeatNumbers
                                            );
                                      
                                            return res.status(400).json({
                                              success: false,
                                              error: ` seats ${selectedSeatNumbers.join(
                                                ', '
                                              )} are already booked for this trip `,
                                            });
                                          }
                                      
                                          await trip.save();
                                      
                                          // Create a new booking
                                          const bookingId = shortid.generate();
                                      
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
                                              ageGroup: calculateAgeGroup(passenger.age)
                                            })),
                                            totalFare: totalFare_in_Euro
                                          });
                                      
                                          await booking.save();
                                      
                                          // Generate passenger details and email content
                                          const passengerDetails = passengers.map((passenger, index) => {
                                            const seatNumber = selectedSeatNumbers[index];
                                            return `
                                                Passenger Name: ${passenger.name}
                                                Age: ${passenger.age}
                                                Gender: ${passenger.gender}
                                                Seat Number: ${seatNumber}
                                                -----------------------------------------
                                            `;
                                          }).join('\n');
                                      
                                          const emailContent = `Dear ${user.fullName}\n Your booking for departure on ${date} has been confirmed.\n\n Journey Details:\n 
                                                Booking ID: ${bookingId} 
                                                Trip Number : ${trip.tripNumber}
                                                Bus Arrival Time: ${source.arrivalTime}     
                                                Source: ${source} 
                                                Destination: ${destination}                                 
                                                Passenger Details:
                                                ${passengerDetails}  \n
                                                Driver Details : 
                                                \t Driver Name : ${Driver.driverName}\n
                                                    Driver Contact : ${Driver.driverContact}                                       
                                    
                                                Have a safe journey!
                                                Thank you for choosing our service!`;
                                    
                                        // Generate the QR CODE and send the booking confirmation email
                                        const qrCodeData = `http://192.168.1.28:3000/${bookingId}`;
                                        const qrCodeImage = 'ticket-QRCODE.png';
                                        await qrcode.toFile(qrCodeImage, qrCodeData);
                                    
                                        await sendBookingEmail(email, 'Your Booking has been confirmed', emailContent);
                                    
                                        res.status(200).json({
                                          success: true,
                                          message: 'Booking successful. Ticket sent to user email.'
                                        });
                                      } catch (error) {
                                        console.error(error);
                                        return res.status(500).json({
                                          success: false,
                                          error: 'An error occurred'
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
                          const {tripId , email , bookingId } = req.body;

                          if (!email) {
                              return res.status(400).json({ success: false, error: 'Missing Email' });
                          }
                          if (!bookingId) {
                              return res.status(400).json({ success: false, error: 'Missing bookingId' });
                          }

                          const booking = await BookingModel.findOne({  bookingId });
                          if (!booking) {
                              return res.status(404).json({ success: false, error: 'Booking not found' });
                          }

                            // check if the booking status allows cancellation 
                            if(booking.status !=='confirmed')
                            {
                              return res.status(400).json({ success : false , error : 'Booking already cancelled '})
                            }

                              // marked the booking as canclled
                              booking.status = 'cancelled';
                              await booking.save();
                              
                              // update the available seats and booked seats on the bus
                                const trip = await TripModel.findById(tripId)
                                if(!trip)
                                {
                                  res.status(400).json({
                                                    success : false ,
                                                    error : 'trip not found'
                                  })
                                }
                                
                                  const { selectedSeatNumbers } = booking    

                              if(trip)
                              {
                                for(const seat of selectedSeatNumbers)
                                {
                                  const index = trip.booked_seat.indexOf(seat)
                                  if(index !== -1)
                                  {
                                    trip.booked_seat.splice(index, 1)
                                    trip.Available_seat.push(seat)
                                  }
                                }
                                    await trip.save()
                              }
                                   // send a confirmation email to the user
                                   const user = await UserModel.findById(booking.userId)
                                   
                                   const emailContent = `Dear ${user.fullName},\nYour booking with Booking ID ${booking.bookingId} has been canceled.\n\nThank you for using our service.`;
                                    await sendCancelEmail(user.email , 'Ticket Cancellation Confirmation', emailContent)
                                      
                                      

                                    res.status(200).json({ success: true, message: 'Ticket cancellation successful. Confirmation sent to user email.' });
                                  } catch (error) {
                                    console.error(error);
                                    return res.status(500).json({ success: false, error: 'An error occurred' });
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
                                          else if(status === 'panding' || status == 'cancelled')
                                          {
                                            tickets = await BookingModel.find({ userId , status : {$in: ['pending', 'cancelled']}})
                                          }
                                          else
                                          {
                                            return res.status(400).json({ success : false , error : 'Invalid Status Value' })
                                          }

                                          res.status(200).json({ success : true , message : " user Tickets" , tickets})
                                        }catch(error)
                                        {
                                          res.status(500).json({ success: false, error: 'Error finding tickets' });

                                        }
                                      }

  // APi for change trip Date 

                                            const getUpcomingTrip_for_DateChange = async (req, res) => {
                                              try {
                                              
                                                      const currentDate = new Date();
                                            
                                                // Aggregate trips and group them by routeId
                                                const aggregatedTrips = await TripModel.aggregate([
                                                  {
                                                    $match: {
                                                      startingDate: { $gt: currentDate },
                                                    },
                                                  },
                                                  {
                                                    $group: {
                                                      _id: '$routeId', 
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
                                                const commonRouteIdTrips = aggregatedTrips.map((group) => group.trips).flat();
                                            
                                                res.status(200).json({ success: true, message: 'Select the trips for changing the Date', trips: commonRouteIdTrips });
                                              } 
                                              catch (error) {
                                                console.error('Error while fetching trips:', error);
                                                res.status(500).json({ success: false, error: 'There was an error while fetching trips' });
                                              }
                                            };     
                                            
                                            
                          
      // change Trip

                          const changeTrip = async (req, res) => {
                            try {
                              const { bookingId, newTripId } = req.body;
                          
                              const requiredFields = ['bookingId', 'newTripId'];
                          
                              for (const field of requiredFields) {
                                if (!req.body[field]) {
                                  return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                }
                              }
                          
                              const booking = await BookingModel.findOne({ bookingId });
                          
                              if (!booking) {
                                return res.status(404).json({ success: false, error: 'Booking not found' });
                              }
                          
                              if (booking.tripUpdated) {
                                return res.status(400).json({ success: false, error: 'Trip already updated once' });
                              }
                          
                              const oldTripId = booking.tripId;
                          
                              // Find the old and new trips based on tripIds
                              const oldTrip = await TripModel.findById(oldTripId);
                          
                              if (!oldTrip) {
                                console.error(`Old Trip not found for ID: ${oldTripId}`);
                                return res.status(404).json({ success: false, error: 'Old Trip not found' });
                              }
                          
                              const newTrip = await TripModel.findById(newTripId);
                          
                              if (!newTrip) {
                                console.error(`New Trip not found for ID: ${newTripId}`);
                                return res.status(404).json({ success: false, error: 'New trip not found' });
                              }
                          
                              if (!Array.isArray(booking.selectedSeatNumbers) || booking.selectedSeatNumbers.length !== booking.passengers.length) {
                                return res.status(400).json({ success: false, error: 'Invalid selected seat number' });
                              }
                          
                              // Check if oldTrip and oldTrip.booked_seat are defined and are arrays
                              if (!oldTrip || !Array.isArray(oldTrip.booked_seat)) {
                                return res.status(400).json({
                                  success: false,
                                  error: 'Invalid old trip data',
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
                              }
                          
                              // Check if there are available seats in the new trip
                              if (newTrip.Available_seat.length === 0) {
                                return res.status(400).json({
                                  success: false,
                                  error: 'No available seats in the new trip. Please select another trip.',
                                });
                              }
                          
                              // Save changes
                              await Promise.all([oldTrip.save(), newTrip.save(), booking.save(), existingBooking ? existingBooking.save() : null]);
                          
                              return res.status(200).json({
                                success: true,
                                message: 'Trip changed successfully',
                              });
                          
                            } catch (error) {
                              console.error(error);
                              return res.status(500).json({
                                success: false,
                                error: 'There is an error',
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
                              const { status , date} = req.query
                          
                              if (!date) {
                                return res.status(400).json({ success: false, error: ' date is required' });
                              }
                          
                              let bookings;
                              const dateQuery = new Date(date);
                              if (status === 'confirmed') {
                                bookings = await BookingModel.find({ status: 'confirmed',  date : dateQuery });
                              } else if (status === 'pending' || status === 'cancelled') {
                                bookings = await BookingModel.find({ status: { $in: ['pending', 'cancelled'] },  date : dateQuery });
                              } else {
                                return res.status(400).json({ success: false, error: 'Invalid status value' });
                              }
                          
                              const count = bookings.length;
                          
                              res.status(200).json({ success: true, message: `Count of ${status} bookings for date ${date}`, count , Bookings : bookings});
                            } catch (error) {
                              res.status(500).json({ success: false, error: 'An error occurred while retrieving bookings' });
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
                                return res.status(400).json({ success: false, error: 'Trip not found' });
                              }
                              
                              // Find the route in a trip using tripId
                              const routeId = trip.routeId;
                          
                              const route = await BusRoute.findById(routeId);
                              if (!route) {
                                return res.status(400).json({ success: false, error: 'Route not found in trip' });
                              }
                          
                              // Get the stops and arrival times for the route
                              const stops = route.stops || [];
                          
                              // Find the currentStop
                              const currentStopIndex = stops.findIndex((stop) => stop.stopName === yourStopName);
                          
                              if (currentStopIndex === -1) {
                                return res.status(400).json({ success: false, error: 'Current stop not found' });
                              }
                          
                              const currentStop = stops[currentStopIndex];
                              let previousStop = null;
                              let timeTakenFromPrevStop = 'none';
                          
                              if (currentStopIndex > 0) {
                                previousStop = stops[currentStopIndex - 1];
                                timeTakenFromPrevStop = calculateTravelTime(previousStop.departureTime, currentStop.arrivalTime);
                              }
                          
                              res.status(200).json({
                                success: true,
                                message: 'Bus Tracking Information',
                                Bus_Tracking: {
                                  your_Stop: {
                                    stopName: currentStop.stopName,
                                    arrivalTime: currentStop.arrivalTime,
                                  },
                                  previousStop: previousStop
                                    ? {
                                        stopName: previousStop.stopName,
                                        departureTime: previousStop.departureTime,
                                      }
                                    : null,
                                    timeTaken_From_PrevStop: timeTakenFromPrevStop,
                                },
                              });
                            } catch (error) {
                              console.error(error);
                              res.status(500).json({ success: false, error: 'There is an error tracking the BUS' });
                            }
                          };
                          
                          // Function to calculate travel time
                          const calculateTravelTime = (departureTime, arrivalTime) => {
                            const prevTime = moment(departureTime, 'hh:mm A');
                            const currentTime = moment(arrivalTime, 'hh:mm A');
                          
                            const timeDiff = currentTime.diff(prevTime, 'minutes');
                            return `${Math.floor(timeDiff / 60)} hours ${timeDiff % 60} minutes`;
                          };
                          

            
  
  
  

                
  
          
                

                    
    
                
    module.exports = { 
                        adminLogin , changePassword, addBus , updateBus ,
                        deleteBus, allBuses ,getBus, addRoute , allroutes , editRoute,addStop_in_Route,
                        editStop_in_Route, addStopBeforeStop, deleteStop_in_Route,  deleteRoute ,
                         searchTrips , createStop ,  addStopBeforeStop, allStops ,
                         deleteStop , changeProfile , addDriver ,editDriver,
                         deleteDriver , allDrivers ,getDriver , createTrip, bookTicket, cancelTicket,
                          userTickets , getUpcomingTrip_for_DateChange , changeTrip , allBookings,countBookings , viewSeats ,
                          calculateFareForSelectedSeats , trackBus 
                         
                         
                         
                        
                      }
                       
                    