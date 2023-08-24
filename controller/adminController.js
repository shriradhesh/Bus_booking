const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Admin = require('../models/adminModel')
const changePass  = require('../models/changePassword')
const BookingModel = require('../models/BookingModel')
const UserModel = require('../models/userModel');
const BusModel = require('../models/busModel')
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
                    const { id , oldPassword , newPassword , confirmPassword} = req.body                
                      

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
        depot_station,
        status, 
      } = req.body;
       
      const requiredFields = [
        'bus_type',
        'seating_capacity',
        'bus_no',            
        'model',
        'manufacture_year',
        'amenities',
        'depot_station',
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
        depot_station: depot_station,
        status: busStatus, 
      });
  
      const savedBus = await newBus.save();
      res.status(200).json({ success: true, message: 'Bus Added successfully', Bus: savedBus });
    } catch (error) {
      console.error('Error while adding the Bus', error);
      res.status(500).json({ success: false, message: 'Error while adding the Bus', error: error });
    }
  };
  



  // Api for Edit bus with id
  const editBus = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            bus_type,
            seating_capacity,            
            model,
            manufacture_year,
            amenities,
            depot_station,
            status,
            availability
        } = req.body;

        const requiredFields = [
            'bus_type',
            'seating_capacity',            
            'model',
            'manufacture_year',
            'amenities',
            'depot_station',
            'status',
            'availability'
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
        existBus.model = model;
        existBus.manufacture_year = manufacture_year;
        existBus.amenities = amenities;
        existBus.depot_station = depot_station;
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
        res.status(200).json({ success: true, message: 'Bus Details Edit Successfully', bus: updatedBus });
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
                            res.status(400).json({ success: false, error: 'Bus cannot be deleted due to status or availability' });
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


                                                    /* Route Management */

// Api for Add Route
                 
const addRoute = async(req,res)=>{
  try{
       const { s_no , routeNumber ,source , destination,
            starting_Date , end_Date , starting_time , 
            end_time , contact_no, live_Location  ,status , stops} = req.body
     
      
       
              // check field validation
              const requiredFields = [
                's_no',
                'routeNumber',
                'source',            
                'destination',
                'starting_Date',
                'end_Date',
                'starting_time',
                'end_time',                
                'contact_no',
                'live_Location',
                'status',
                'stops',
                
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
               //validation for stops

       if (!stops || !Array.isArray(stops) || stops.length === 0) {
           return res.status(400).json({ error: 'Missing stops or invalid format', success: false });
       }            


       const newRoute = new BusRoute({

           s_no : s_no,
           routeNumber : routeNumber,
           source : source,
           destination : destination,
           starting_Date: starting_Date,
           end_Date: end_Date,
           starting_time: starting_time,
           end_time : end_time,                       
           contact_no : contact_no,
           live_Location: live_Location,                        
           status: status,
           stops: stops                   
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
                                routeNumber,
                                source,
                                destination,
                                starting_Date,
                                end_Date,
                                starting_time,
                                end_time,
                                busId,
                                contact_no,
                                live_Location,
                                 status,
                                driverId,
                              
                            } = req.body
                           
                            // check field validation
              const requiredFields = [                
                'routeNumber',
                'source',            
                'destination',
                'starting_Date',
                'end_Date',
                'starting_time',
                'end_time', 
                'busId',               
                'contact_no',
                'live_Location',
                'status',
                'driverId',
                
            ];
        
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                }
            }
                         
                           
                           // check for route existance 
                        
                    const existRoute = await BusRoute.findOne({_id:routeId})
                    if(!existRoute)
                    {                        
                      return res.status(404).json({ success : false ,  error : `route not found `})
                    }
                    
                        // Check if the Bus ID is already assigned to a different route
                        if (busId) {
                          const existingBusRoute = await BusRoute.findOne({ busId });
                          if (existingBusRoute && existingBusRoute._id.toString() !== routeId) {
                              return res.status(400).json({ success: false, error: `Bus ID is already assigned to a different route` });
                          }                         
                       }
                       
                        // Check if the driver ID is already assigned to a different route
                    if (driverId) {
                      const existingDriverRoute = await BusRoute.findOne({ driverId });
                      if (existingDriverRoute && existingDriverRoute._id.toString() !== routeId) {
                          return res.status(400).json({ success: false, error: `Driver ID is already assigned to a different route` });
                      }
                   }
                   
                    
                        //update the properties
                        existRoute.routeNumber = routeNumber;
                        existRoute.source = source;
                        existRoute.destination = destination;
                        existRoute.starting_Date = starting_Date;
                        existRoute.end_Date = end_Date;
                        existRoute.starting_time = starting_time;
                        existRoute.end_time = end_time;
                        existRoute.busId = busId;
                        existRoute.contact_no = contact_no;
                        existRoute.live_Location = live_Location;                        
                        existRoute.status = status;
                        existRoute.driverId = driverId;
                       
                        
                        // Save the data into the database
                        const updatedRoute = await existRoute.save();
                        res.status(200).json({ success: true, message: ' Route Details Edit Successfully', bus: updatedRoute });
                        } catch (error) {
                            console.error(error);
                        res.status(500).json({ success: false, error: 'Error while editing the route details' });
                        }
                    };
            
    // Api for delete Route 
    const deleteRoute = async (req, res) => {
        try {
          const id = req.params.id;
          const route = await BusRoute.findById(id);
      
          if (!route) {
            return res.status(404).json({ success: false, error: 'Route not found' });
          }
      
          await route.deleteOne();
          res.status(200).json({ success: true, message: 'Route deleted successfully' });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error while deleting the route' });
        }
      };
  // Api for Get a Route details by Route id
  const getRoute = async (req, res) => {
    try {
      const routeId = req.params.routeId;
      const route = await BusRoute.findById(routeId);

      if (!route) {
        return res.status(404).json({success : false ,  error: 'Route not found' });
      }

      res.status(200).json({ success : true , message : " Route found" , Route_Detail : route });
    } catch (err) {
      res.status(500).json({ success : false , error: 'Error while finding the Route' });
    }
  }

                                /*   stops manage for Route   */
     
      //API for add stop in a route with route id 

           const addStop = async (req,res)=>{
          
            const routeId = req.params.routeId
           const {stopName , arrivalTime, departureTime, distance} = req.body          
            
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
                    return res.status(400).json({ success : false , error : `Route not found with the routeId ${routeId}`})
                }

                route.stops.push({
                    stopName,
                    arrivalTime,
                    departureTime,
                    distance
                })
                await route.save()

                return res.status(200).json({ success : true , message : `stop added successfully to routeId :  ${routeId}`})
            }
            catch(error)
            {
                return res.status(500).json({ success : false , message : ` an error occured while adding the stop` , error : error})
            }
           }

      // Api for EDIT Stops in a route with route Id and stop Id
      const editStop = async (req, res) =>{
       let routeId
        try{
            const stopId = req.params.stopId
             routeId = req.params.routeId          
           
            const {
              stopName,
              arrivalTime,
              departureTime,
              distance
            } = req.body

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

                 // check for route existance
                const existRoute = await BusRoute.findOne({_id:routeId})
                if(!existRoute)
                {
                  return res.status(404).json({ success: false , error : " route not found "})
                }
                    
                    // check for stop
                const existStop = existRoute.stops.find(stop => stop._id.toString() === stopId)                     
                  if(!existStop)
                  {
                    return res.status(404).json({ success : false , error : "stop not found"})
                  }
                        //update the property of  stops
                      existStop.stopName = stopName
                      existStop.arrivalTime = arrivalTime
                      existStop.departureTime = departureTime
                      existStop.distance = distance
                       
                         await BusRoute.findOneAndUpdate(
                          {_id: routeId, 'stops._id': stopId},
                          {$set: { 'stops.$' : existStop}

                              }
                         )
                           
                      res.status(200).json({ success : true , message :` stop is edit successfully for routeID : ${routeId}`})
                      
              }        
       catch(error)
       {
        
          res.status(500).json({success: false , error : ` there is an error to update the stop in routeId : ${routeId}`})
       }
       }

    // get all stops form the route ID
                   const allStops = async(req,res)=>{
                    try{
                      const routeId = req.params.routeId
                      const route = await BusRoute.findOne({ _id:routeId})
                      if(!route)
                      {
                        return res.status(404).json({ success : false , error : ' Route not found '})
                      }                          

                          const stops = route.stops
                          return res.status(200).json({ success : true , message : " all Stops : ", stops : stops})

                    }
                    catch(error)
                    {
                      console.error(error);
                          return res.status(500).json({ success : false , errror : " there is an error to get all stops" , })
                    }
                   }
                    
    // Delete a particular stop by stopId with the help of routeId
                
                    const deleteStop = async (req ,res)=>{
                      let routeId 
                      try{
                            const stopId = req.params.stopId
                            routeId = req.params.routeId
                            const existRoute = await BusRoute.findById(routeId)   
                                                        
                            if(!existRoute)
                            {
                              return res.status(404).json({ success : false , error : " route not found"})
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

                                res.status(200).json({ success : true , message : "stop delete successfully"})
                      
                        }
                       catch(error)
                       {
                            res.status(500).json({ success : false , error :  ` there is an error to delete the stop `})
                       }
                      }
            
                                                  /* fare Manage for Stops */
  // API FOR calculate and assign fare between stops
                    const calculateStopfare = async (req, res) => {
                      try {
                        const routeId = req.params.routeId
                        const { source, destination } = req.body;

                        if (source === undefined || destination === undefined) {
                          return res.status(400).json({ error: 'Missing stop indices', success: false });
                        }
                                // access the bus Route from the Database
                          const busRoute = await BusRoute.findById(routeId)
                          if(!busRoute)
                          {
                            return res.status(400).json({ success : false, errror : " Route not found"})
                          }
                          const stops = busRoute.stops

                          const sourceIndex = stops.findIndex(stop => stop.stopName === source)
                          const destinationIndex = stops.findIndex(stop => stop.stopName === destination)
                                if(sourceIndex === -1 || destinationIndex === -1){
                                  return res.status(400).json({ success : false , error : "Source or destination stop not found"})
                                }
                              // calculate fare logic 
                              const calculateFare = (sourceDistance , destinationDistance) => {
                                const farePerUnitDistance = 0.5;                               
                                const totalDistance =destinationDistance - sourceDistance
                               const totalFare = totalDistance * farePerUnitDistance;
                                return totalFare;
                              };

                              const sourceDistance = stops[sourceIndex].distance
                              const destinationDistance = stops[destinationIndex].distance

                              // calculate total fare

                              const totalFare = calculateFare(sourceDistance , destinationDistance);
                          
                              return res.status(200).json({
                                success: true,
                                message: 'Fare calculated successfully',
                                fare: totalFare,
                              });
                            } catch (error) {
                              console.error(error);
                              return res.status(500).json({ success: false, error: 'An error occurred while calculating fare' });
                            }
                          }
  
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



                                             /*  Manage Tickit */

    // api for book tickit               
    
                  const bookTicket = async (req, res) => {
                    try {
                            const { routeNumber,departureDate, status ,email , source , destination , passengers} = req.body;             
                  
                            const requiredFields = [ 'routeNumber','departureDate', 'email','passengers']; 
                    
                            for (const field of requiredFields) {
                                if (!req.body[field]) {
                                    return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                }
                            }   
                                    const user = await UserModel.findOne({email});
                                    if (!user) {
                                        return res.status(400).json({ success: false, error: 'User not found' });
                                    }
                                    const userId = user._id;
                                    const route = await BusRoute.findOne({routeNumber}).populate('busId')                        
                          
                                    if (!route) {
                                      return res.status(400).json({ success: false, error: 'Route not found' });
                                      }
                                    const bus = route.busId
                                    
                                      if(!bus)
                                      {
                                        return res.status(400).json({success : false , error :'Bus not found'  })
                                      }
                                     

                                      // calculate the number of passengers and update the user bookseat count
                                      const busCapacity = bus.seating_capacity;
                                      const numPassengers = passengers.length 
                                      const userBookedSeatsCount = await BookingModel.countDocuments({ routeNumber, departureDate });

                                      if (userBookedSeatsCount + numPassengers > busCapacity) {
                                          return res.status(400).json({ success: false, error: 'Exceeded maximum allowed seats' });
                                      }
                                      const bookingId = shortid.generate();
                                     

                                      const sourceStopDetails = route.stops.find(stop => stop.stopName === source);
                                      const destinationStopDetails = route.stops.find(stop => stop.stopName === destination);
                      

                                      // const bookingPromises = passengers.map(async (passenger)=>{
                                    
                                      // })
                                      for (const passenger of passengers) {
                                        const passengerSeat = passenger.seatNumber;
                            
                                        const isSeatBooked = await BookingModel.findOne({
                                            seatNumber: passengerSeat,
                                            departureDate
                                        });
                            
                                        if (isSeatBooked) {
                                            return res.status(400).json({ success: false, error: `Seat already booked` });
                                        }
                                    }
                                
                                    const booking = new BookingModel({
                                      routeNumber,
                                      departureDate,
                                      status,
                                      bookingId,
                                      userId,
                                      passengers: passengers
                                  });   
                                    await booking.save();                            
                                  
                                      const passengerDetails = passengers.map(passenger =>`
                                      Passenger Name : ${passenger.name}
                                      Age : ${passenger.age}
                                      Gender : ${passenger.gender}
                                      Seat Number : ${passenger.seatNumber}
                                        -----------------------------------------
                                        `).join('\n')
                                  
                                    const emailContent = `Dear ${user.fullName}\n Your booking  for departure on ${departureDate} has been confirmed.\n\n Journey Details:\n 
                                        Booking ID: ${bookingId} 
                                        Bus Number : ${bus.bus_no} \n
                                        Bus Departure Time : ${route.starting_Date}\n
                                        Source: ${sourceStopDetails.stopName}\n
                                        Destination: ${destinationStopDetails.stopName}\n    
                                        PassengerDetails : ${passengerDetails}
                                        Have a safe journey !
                                        Thank you for choosing our service! `;

                                          // Generate the QR CODE 

                                              const qrCodeData = `http://192.168.1.25:3000/${bookingId}`;

                                              const qrCodeImage = 'tickit-QRCODE.png' 
                                              await qrcode.toFile(qrCodeImage , qrCodeData)  
                                              
                                                                      
                    
                                        // Send booking confirmation email
                              
                                              await sendBookingEmail(email , 'Your Booking has been confirmed' , emailContent); 
                                            res.status(200).json({ success: true, message: 'Booking successful Tickit  sent to user email' });
                                      
                                      } 
                                    catch (error) 
                                  {
                                    console.error(error);
                                      return res.status(500).json({success : false ,  error: "An error occured"});
                                  }
                                }
    
  // Api for cancle tickit 
        const cancelTicket = async (req, res) => {
          try {
              const { email , bookingId } = req.body;
      
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

                 // store cancled seatNumber to update bus seat avaialblity
              const canceledSeatNumbers =booking.passengers.map(passenger => passenger.seatNumber);


              // Update seat availability on the associated bus route
               const busRoute = await BusRoute.findOne({ routeNumber: booking.routeNumber });
               if (busRoute) {
            const bus = await BusModel.findById(busRoute.busId);
            if (bus) {
                busRoute.passengers = busRoute.passengers.filter(passenger => !canceledSeatNumbers.includes(passenger.seatNumber));
                bus.availableSeats += canceledSeatNumbers.length;
                await busRoute.save();
                await bus.save();
            }
        }
              booking.status = 'cancelled';
              await booking.save();
      
              const user = await UserModel.findOne({email});
              if (!user) {
                  return res.status(400).json({ success: false, error: 'User not found' });
              }
      
              const emailContent = `Dear ${user.fullName},\nYour booking with Booking ID: ${bookingId} has been cancelled.\n\n your Money will be refund shortly We apologize for any inconvenience caused.\n\nThank you.`;
      
              await sendCancelEmail(user.email, 'Ticket Cancellation Confirmation', emailContent);
      
              res.status(200).json({ success: true, message: 'Ticket cancellation successful, cancellation email sent.' });
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

        // APi for ModifyTicket ( departureDate , seatNumber)

                      const modifyTicket = async (req,res)=>{
                        try{
                          const { bookingId , newDepartureDate } = req.body
                          const requiredFields = [                
                            'bookingId',
                            'newDepartureDate',                               
                        ];
                    
                        for (const field of requiredFields) {
                            if (!req.body[field]) {
                                return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                            }
                        }    
                        
                        const booking = await BookingModel.findOne({ bookingId})
                        if (!booking) {
                          return res.status(404).json({ success: false, error: 'Booking not found' });
                        }   

                         if(booking.departureDateUpdated)
                         {
                          return res.status(400).json({ success : false , error: 'Departure date already updated once'})
                         }
                              booking.departureDate = newDepartureDate
                              booking.departureDateUpdated = true
                              await booking.save()
                                
                                res.status(200).json({ success : true , message : ' Tickit details modified Successfully '})
                        
                        }catch(error)
                        {
                            console.error(error);
                            return res.status(500).json({ success : false , error : 'An error occured '})
                        }
                      }
               
                                                      /* Booking Manage */
          //Api for get all Bookings
                 
          const allBookings = async (req, res) => {
            try {
              const status = req.query.status;
          
              let bookings;
              if (status === 'confirmed') {
                bookings = await BookingModel.find({ status: 'confirmed' });
              } else if (status === 'pending' || status ==='cancelled') {
                bookings = await BookingModel.find({ status:  {$in:['pending','cancelled'] }});
              } else {
                return res.status(400).json({ success: false, error: 'Invalid status value' });
              }
                
              res.status(200).json({ success: true, message: 'All Tickites', All_Bookings : bookings });
            } catch (error) {
              
              res.status(500).json({ success: false, error: 'There is an error to find Bookings '});
            }
          }
              
       // Api for update seat status 

                      const updateSeatAvailability = async (req, res) => {
                        try {
                            const { bookingId} = req.body;
                            const requiredFields = ['bookingId']
                    
                            for (const field of requiredFields) {
                                if (!req.body[field]) {
                                    return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                }
                            }                    
                            const booking = await BookingModel.findOne({ bookingId });
                            if (!booking) {
                                return res.status(400).json({ success: false, error: 'Booking not found' });
                            }
                    
                            // Store seat numbers for updating seat availability
                               const canceledSeatNumbers = booking.passengers.map(passenger => passenger.seatNumber);

                        // Update seat availability on the associated bus route
                        const busRoute = await BusRoute.findOne({ routeNumber: booking.routeNumber });
                        if (busRoute) {
                            const bus = await BusModel.findById(busRoute.busId);
                            if (bus) {
                                busRoute.passengers = busRoute.passengers.filter(passenger => !canceledSeatNumbers.includes(passenger.seatNumber));
                                bus.availableSeats += canceledSeatNumbers.length;
                                await busRoute.save();
                                await bus.save();
                            }
                        }

                        res.status(200).json({ success: true, message: 'Seat availability updated successfully.' });
                    } catch (error) {
                        console.error(error);
                        return res.status(500).json({ success: false, error: 'An error occurred' });
                    }
                }

                    
    
                
    module.exports = {
                       adminLogin , changePassword, addBus , editBus ,
                       deleteBus, allBuses ,getBus, addRoute , allroutes , editRoute,
                      deleteRoute  , getRoute , addStop , editStop , allStops , 
                        deleteStop ,calculateStopfare, changeProfile , addDriver ,
                         editDriver,deleteDriver , allDrivers , getDriver , bookTicket,
                         cancelTicket, userTickets ,modifyTicket, allBookings,
                         updateSeatAvailability
                     }
                    