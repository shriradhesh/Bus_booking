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
const sendSms = require('../utils/smsNotification')
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
                      // Create an array for available seats
                         const availableSeat = Array.from({ length: seating_capacity }, (_, index) => index + 1);


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
                          Available_seat : availableSeat ,
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
                                  // Create an array for available seats
                         const availableSeat = Array.from({ length: seating_capacity }, (_, index) => index + 1);
 

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
                  
  // Api for searchBuses   
                    const searchBuses = async (req, res) => {
                      try {
                        const { sourceStop, destinationStop, date } = req.body;
                    
                        // Find routes that match the selected date
                        const routes = await BusRoute.find({
                          starting_Date: { $lte: date },
                          end_Date: { $gte: date }
                        });                    
                       
                        if (!routes || routes.length === 0) {
                          return res
                            .status(404)
                            .json({ success: false, error: 'No matching routes found for the selected date' });
                        }                       
                             
                        // Extract bus IDs from the matching routes
                        const busIds = routes.flatMap(route => route.busInfo.map(info => info.busId)).filter(Boolean);

                       
                        // Find buses with stops matching both source and destination and are in the list of matching bus IDs
                        const buses = await BusModel.find({
                          _id: { $in: busIds },
                          'stops.stopName': { $all: [sourceStop, destinationStop] }
                          
                        });             
                       
                    
                        if (!buses || buses.length === 0) {
                          return res.status(404).json({ success: false, error: 'No matching buses found' });
                        }

                        // filter buses to include only those where source stop comes before destination stop

                        const filteredBuses = buses.filter(bus => {
                          const sourceIndex = bus.stops.findIndex(stop => stop.stopName === sourceStop)
                          const destinationIndex = bus.stops.findIndex(stop => stop.stopName === destinationStop)
                          return sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex
                        })
                    
                        res.status(200).json({ success: true, message: 'Buses for the route', Bus_Details: filteredBuses });
                      } catch (error) {
                        console.error(error);
                        res.status(500).json({ success: false, error: 'Error while fetching the data' });
                      }
                    };
  
                              
                                              
  
                                             /*   stops manage for Route   */
     
      //API for add stop in a bus with bus id 

           const addStop = async (req,res)=>{
          
            const busId = req.params.busId
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
                       
                const bus = await BusModel.findOne({ _id:busId })
           
                if(!bus)
                {
                    return res.status(400).json({ success : false , error : `bus not found with the BusId ${busId}`})
                }

                bus.stops.push({
                    stopName,
                    arrivalTime,
                    departureTime,
                    distance
                })
                await bus.save()

                return res.status(200).json({ success : true , message : `stop added successfully to busId :  ${busId}`})
            }
            catch(error)
            {
                return res.status(500).json({ success : false , message : ` an error occured while adding the stop` , error : error})
            }
           }

      // Api for EDIT Stops in a bus with bus Id and stop Id
      const editStop = async (req, res) =>{
       let busId
        try{
            const stopId = req.params.stopId
             busId = req.params.busId          
           
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
                const existBus = await BusModel.findOne({_id:busId})
                if(!existBus)
                {
                  return res.status(404).json({ success: false , error : " bus not found "})
                }
                    
                    // check for stop
                const existStop = existBus.stops.find(stop => stop._id.toString() === stopId)                     
                  if(!existStop)
                  {
                    return res.status(404).json({ success : false , error : "stop not found"})
                  }
                        //update the property of  stops
                      existStop.stopName = stopName
                      existStop.arrivalTime = arrivalTime
                      existStop.departureTime = departureTime
                      existStop.distance = distance
                       
                         await BusModel.findOneAndUpdate(
                          {_id: busId, 'stops._id': stopId},
                          {$set: { 'stops.$' : existStop}

                              }
                         )
                           
                      res.status(200).json({ success : true , message :` stop is edit successfully for BusId : ${busId}`})
                      
              }        
       catch(error)
       {
        
          res.status(500).json({success: false , error : ` there is an error to update the stop in BusId : ${busId}`})
       }
       }
      // Api to add stop before the stop
      const addStopBeforeStop = async (req, res) => {
        const busId = req.params.busId;
        const { beforeStopName, stopName, arrivalTime, departureTime, distance } = req.body;
    
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
    
            const bus = await BusModel.findOne({ _id: busId });
    
            if (!bus) {
                return res.status(400).json({ success: false, error: `Bus not found with the BusId ${busId}` });
            }
    
            const beforeStopIndex = bus.stops.findIndex(stop => stop.stopName === beforeStopName);
    
            if (beforeStopIndex === -1) {
                return res.status(400).json({ success: false, error: `Stop '${beforeStopName}' not found on the Bus` });
            }
    
            const newStop = {
                stopName,
                arrivalTime,
                departureTime,
                distance
            };
    
            bus.stops.splice(beforeStopIndex, 0, newStop);
            await bus.save();
    
            return res.status(200).json({ success: true, message: `Stop '${stopName}' added successfully before '${beforeStopName}' on BusId: ${busId}` });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'An error occurred while adding the stop', error });
        }
    };
    
    // get all stops form the bus ID
    const allStops = async (req, res) => {
      
        try {
          const busId = req.params.busId;
      
          // Check if the bus exists
          const bus = await BusModel.findById(busId);
      
          if (!bus) {
            return res.status(404).json({ success: false, error: 'Bus not found' });
          }
      
          const stops = bus.stops;
          return res.status(200).json({ success: true, message: 'All Stops:', stops: stops });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ success: false, error: 'There was an error getting all stops for the bus' });
        }
      };
      
      
      
    
    
                      
                    
    // Delete a particular stop by stopId with the help of bus
                
                    const deleteStop = async (req ,res)=>{
                      let busId 
                      try{
                            const stopId = req.params.stopId
                            busId = req.params.busId
                            const existBus = await BusModel.findById(busId)   
                                                        
                            if(!existBus)
                            {
                              return res.status(404).json({ success : false , error : " bus not found"})
                            }
                            
                            // check for stop
                            const existStopIndex = existBus.stops.findIndex(stop => stop._id.toString() === stopId)
                               if(existStopIndex === -1)
                               {
                                 return res.status(404).json({ success : false , error : " Stop not found"})
                                }  
                                // remove the stop from the stop array
                                
                                existBus.stops.splice(existStopIndex, 1)

                                await BusModel.findByIdAndUpdate(
                                      { _id:busId },
                                      {stops : existBus.stops}
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
                      const busId = req.params.busId;
                      const { source, destination } = req.body;
                  
                      if (source === undefined || destination === undefined) {
                        return res.status(400).json({ error: 'Missing stop indices', success: false });
                      }
                      // Access the bus Route from the Database
                      const bus = await BusModel.findById(busId);
                      if (!bus) {
                        return res.status(400).json({ success: false, error: 'Bus not found' });
                      }

                      // calculate the discance between source and destination stops
                      const stops = bus.stops;
                      
                      const sourceIndex = stops.findIndex(stop => stop.stopName === source);
                      const destinationIndex = stops.findIndex(stop => stop.stopName === destination);
                      
                      if (sourceIndex === -1 || destinationIndex === -1) {
                        return res.status(400).json({ success: false, error: 'Source or destination stop not found' });
                      }   
                      const sourceDistance = stops[sourceIndex].distance;
                      const destinationDistance = stops[destinationIndex].distance;
                  
                      // calculate total distance and fare based on bus type

                      const totalDistance = destinationDistance - sourceDistance

                          // check the bus type and set farePerUnitDistance accordingly
                          let farePerUnitDistance
                          switch (bus.bus_type) {
                            case 'Non-AC':
                                farePerUnitDistance = 0.2;
                              break;
                             case 'AC' :
                                farePerUnitDistance = 0.24;
                                break;
                             case 'luxury' :
                              farePerUnitDistance = 0.3;
                              break; 
                            default:
                                  farePerUnitDistance = 0.2;
                              }                     
                              // Calculate total fare 
                              const totalFare = totalDistance * farePerUnitDistance                              
                         
                          return res.status(200).json({
                            success: true,
                            message: 'Fare calculated successfully',
                            busType: bus.bus_type,
                            totalFare : totalFare 
                          });

                        } catch (error) {
                          console.error(error);
                          return res.status(500).json({ success: false, error: 'An error occurred while calculating fare' });
                        }
                      };
                      

                                                    /* Route Management */

// Api for Add Route
                 
                  const addRoute = async(req,res)=>{
                    try{
                        const { s_no , routeNumber ,source , destination,
                                starting_Date , end_Date , 
                              contact_no , status } = req.body
                      
                        
                        
                                // check field validation
                                const requiredFields = [
                                  's_no',
                                  'routeNumber',
                                  'source',            
                                  'destination',
                                  'starting_Date',
                                  'end_Date',                                
                                  'contact_no',               
                                  'status',
                                
                                  
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
                                  
                                 // Convert string dates to Date objects
                              const startDate = new Date(starting_Date);
                              const endDate = new Date(end_Date);


                        const newRoute = new BusRoute({

                            s_no : s_no,
                            routeNumber : routeNumber,
                            source : source,
                            destination : destination,
                            starting_Date: startDate,
                            end_Date: endDate,                                
                            contact_no : contact_no,                                  
                            status: status,
                                            
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
                                        starting_Date,
                                        end_Date,                             
                                        contact_no,                              
                                        status
                                        
                                    } = req.body;
                                          
                                    // // Check field validation
                                    // const requiredFields = [
                                        
                                    //     'source',
                                    //     'destination',
                                    //     'starting_Date',
                                    //     'end_Date',                              
                                    //     'contact_no',                             
                                    //     'status',
                                        
                                    // ];
                                        
                                    // for (const field of requiredFields) {
                                    //     if (!req.body[field]) {
                                    //         return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                                    //     }
                                    // }

                                    // Check for route existence
                                    const existRoute = await BusRoute.findOne({ _id: routeId });
                                    if (!existRoute) {
                                        return res.status(404).json({ success: false, error: `Route not found` });
                                    }
                                       // Convert string dates to Date objects
                                    const startDate = new Date(starting_Date);
                                     const endDate = new Date(end_Date);

                                        console.log(typeof(startDate));
                                        console.log(typeof(endDate));

                                    // Update the properties of the existing route
                                    
                                    existRoute.source = source;
                                    existRoute.destination = destination;
                                    existRoute.starting_Date = startDate;
                                    existRoute.end_Date = endDate;                         
                                    existRoute.contact_no = contact_no;                         
                                    existRoute.status = status;                                   
                                  
                                    // Save the updated route details to the database
                                    const updatedRoute = await existRoute.save();
                                    res.status(200).json({ success: true, message: 'Route Details Edited Successfully', route: updatedRoute });
                                } catch (error) {
                                    console.error(error);
                                    res.status(500).json({ success: false, error: 'Error while editing the route details' });
                                }
                              };

  // APi for add BusId in a Route
                 const addBusId = async (req,res)=>{
          
                  const routeId = req.params.routeId
                 const { busId } = req.body          
                  
                 try{
      
                  const requiredFields = [                
                    'busId' ];
            
                for (const field of requiredFields) {
                    if (!req.body[field]) {
                        return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                    }
                }                             
                      const route = await BusRoute.findOne({ _id:routeId })
                 
                      if(!route)
                      {
                          return res.status(400).json({ success : false , error : `route not found with the routeId ${routeId}`})
                      }
      
                      route.busInfo.push({
                          busId
                      })
                      await route.save()
      
                      return res.status(200).json({ success : true , message : `busId added successfully to route :  ${routeId}`})
                  }
                  catch(error)
                  {
                      return res.status(500).json({ success : false , message : ` an error occured while adding the busId` , error : error})
                  }
                 }

   // Api for Delete busId in a Route
              const deleteBusId = async (req, res) => {
                try {
                    const busId = req.params.Id; // Updated to use :Id
                    const routeId = req.params.routeId;

                    // Find the route by its ID
                    const existRoute = await BusRoute.findById(routeId);

                    if (!existRoute) {
                        return res.status(404).json({ success: false, error: "Route not found" });
                    }

                    // Check for busId in busInfo
                    const existBusIdIndex = existRoute.busInfo.findIndex(bus => bus._id.toString() === busId);

                    if (existBusIdIndex === -1) {
                        return res.status(404).json({ success: false, error: "BusId not found" });
                    }

                    // Remove the busId from the busInfo array
                    existRoute.busInfo.splice(existBusIdIndex, 1);

                    // Update the BusRoute document with the modified busInfo
                    await BusRoute.findByIdAndUpdate(routeId, { busInfo: existRoute.busInfo });

                    res.status(200).json({ success: true, message: "BusId deleted successfully" });
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ success: false, error: "There is an error while deleting the busId" });
                }
            };

            




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



                                             /*  Manage Tickit */

    // api for book tickit               
       
    const bookTicket = async (req, res) => {
      try {
          const { routeNumber, date, selectedSeatNumbers, status, email, source, destination, passengers } = req.body;
          const selectedBusId = req.query.selectedBusId;
  
          // Checking for required fields in the request
          const requiredFields = ['routeNumber', 'date', 'email', 'passengers', 'source', 'destination'];
          if (requiredFields.some(field => !req.body[field])) {
              return res.status(400).json({ success: false, error: `Missing required field` });
          }
  
          // Fetching user details
          const user = await UserModel.findOne({ email });
          if (!user) {
              return res.status(400).json({ success: false, error: 'User not found' });
          }
          const userId = user._id;
  
          // Fetching bus route details
          const route = await BusRoute.findOne({ routeNumber }).populate('busInfo.busId');
          if (!route) {
              return res.status(400).json({ success: false, error: 'Route not found' });
          }
          
  
          // Finding the selected bus
          const selectedBusInfo = route.busInfo.find(busInfo => busInfo.busId && busInfo.busId._id.toString() === selectedBusId);
          if (!selectedBusInfo) {
              return res.status(400).json({ success: false, error: 'Selected bus not found' });
          }
  
          // Check if the booking date is valid (today or a future date)
          const today = new Date().toISOString().split('T')[0];
          if (new Date(date) < new Date(today)) {
              return res.status(400).json({ success: false, error: 'Booking can only be made for today or a future date' });
          }
  
          // Check if source and destination stops are valid
          const sourceStopDetails = selectedBusInfo.busId.stops.find(stop => stop.stopName === source);
          const destinationStopDetails = selectedBusInfo.busId.stops.find(stop => stop.stopName === destination);
  
          if (!sourceStopDetails || !destinationStopDetails) {
              return res.status(400).json({ success: false, error: 'Invalid source or destination stop' });
          }
  
          // Check if the selected seats are available and valid
          const availableSeats = selectedBusInfo.busId.Available_seat;
          const selectedSeats = selectedSeatNumbers;
  
          if (!Array.isArray(selectedSeats) || selectedSeats.length !== passengers.length) {
              return res.status(400).json({
                  success: false,
                  error: 'Invalid selected seat numbers',
              });
          }
  
          for (const seat of selectedSeats) {
              if (typeof seat !== 'number' || seat < 1 || seat > availableSeats.length || !availableSeats.includes(seat)) {
                  return res.status(400).json({
                      success: false,
                      error: `Seat ${seat} is not available`,
                  });
              }
          }
  
          // Check if selected seats are already booked
          const bookedSeats = selectedBusInfo.busId.booked_seat;
          for (const seat of selectedSeats) {
              if (bookedSeats.includes(seat)) {
                  return res.status(400).json({ success: false, error: `Seat ${seat} is already booked` });
              }
          }
  
          // Update Available_seat and booked_seat arrays
          const bus = selectedBusInfo.busId
          for (const seat of selectedSeats) {
              const index = bus.Available_seat.indexOf(seat);
              if (index !== -1) {
                  bus.Available_seat.splice(index, 1);
                  bus.booked_seat.push(seat);
              }
          }

             await bus.save()
  
          // Create a new booking
          const bookingId = shortid.generate();
          const sourceStopArrivalTime = sourceStopDetails.arrivalTime;
  
          const booking = new BookingModel({
              routeNumber,
               busId : bus,
               date: date,
              status,
              bookingId,
              userId: user._id,
              selectedSeatNumbers: selectedSeats,
              passengers: passengers.map((passenger, index) => ({
                  ...passenger,
                  seatNumber: selectedSeats[index],
                  ageGroup: calculateAgeGroup(passenger.age),
              })),
          });
          
          await booking.save();
  
          // Generate passenger details and email content
          const passengerDetails = passengers.map((passenger, index) => {
            const seatNumber = selectedSeats[index];
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
              Bus Number: ${selectedBusInfo.busId.bus_no}
              Bus Arrival Time:${sourceStopArrivalTime}
              Source: ${sourceStopDetails.stopName}
              Destination: ${destinationStopDetails.stopName}
              Passenger Details:
              ${passengerDetails}
              Have a safe journey!
              Thank you for choosing our service!`;
  
          // Generate the QR CODE and send the booking confirmation email
          const qrCodeData = `http://192.168.1.25:3000/${bookingId}`;
          const qrCodeImage = 'tickit-QRCODE.png';
          await qrcode.toFile(qrCodeImage, qrCodeData);
         
           await sendBookingEmail(email, 'Your Booking has been confirmed', emailContent);
                  
                          res.status(200).json({ success: true, message: 'Booking successful. Ticket sent to user email.' });
                      } catch (error) {
                          console.error(error);
                          return res.status(500).json({ success: false, error: 'An error occurred' });
                      }
                  };
  
                              // Function to calculate age group
                              function calculateAgeGroup(age) {
                                  if (age >= 0 && age <= 21) {
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

                            // check if the booking status allows cancellation 
                            if(booking.status !=='confirmed')
                            {
                              return res.status(400).json({ success : false , error : 'Booking can not be cancelled '})
                            }

                              // marked the booking as canclled
                              booking.status = 'cancelled';
                              await booking.save();
                              
                              // update the available seats and booked seats on the bus

                              const { busId , selectedSeatNumbers } = booking
                              const bus = await BusModel.findById(busId)

                              if(bus)
                              {
                                for(const seat of selectedSeatNumbers)
                                {
                                  const index = bus.booked_seat.indexOf(seat)
                                  if(index !== -1)
                                  {
                                    bus.booked_seat.splice(index, 1)
                                    bus.Available_seat.push(seat)
                                  }
                                }
                                    await bus.save()
                              }
                                   // send a confirmation email to the user
                                   const user = await UserModel.findById(booking.userId)
                                   const emailContent = `Dear ${user.fullName},\nYour booking with Booking ID ${booking.bookingId} has been canceled.\n\nThank you for using our service.`;
                                    await sendCancelEmail(user.email , 'Ticket Cancellation Confirmation', cancellationEmailContent)
                         
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

        // APi for ModifyTicket ( starting_Date , seatNumber)

                      const modifyTicket = async (req,res)=>{
                        try{
                          const { bookingId , newstarting_Date } = req.body
                          const requiredFields = [                
                            'bookingId',
                            'newstarting_Date',                               
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

                         if(booking.starting_DateUpdated)
                         {
                          return res.status(400).json({ success : false , error: 'Departure date already updated once'})
                         }
                              booking.starting_Date = newstarting_Date
                              booking.starting_DateUpdated = true
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
              const {status , date} = req.query
          
              let bookings;
              if (!date) {
                return res.status(400).json({ success: false, error: 'Date is required' });
              }
              const dateQuery = new Date(date);
              if (status === 'confirmed') {
                bookings = await BookingModel.find({ status: 'confirmed' , date : dateQuery });
              } else if (status === 'pending' || status ==='cancelled') {
                bookings = await BookingModel.find({ status:  {$in:['pending','cancelled'] } , date : dateQuery});
              }
              else if (!status) {
                bookings = await BookingModel.find({ date: dateQuery });
               } else {
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
                          
                              res.status(200).json({ success: true, message: `Count of ${status} bookings for date ${date}`, count});
                            } catch (error) {
                              res.status(500).json({ success: false, error: 'An error occurred while retrieving bookings' });
                            }
                          }

   // API for View seats in Bus for a route
                                const  viewSeats = async (req, res) => {
                                  try {
                                    const busId = req.params.busId;
                                
                                    // Find the bus by its ID
                                    const bus = await BusModel.findById(busId);
                                
                                    if (!bus) {
                                      return res.status(404).json({ success: false, error: 'Bus not found' });
                                    }
                                
                                    // Convert totalSeats to an array
                                    const totalSeatsArray = Array.from({ length: bus.seating_capacity }, (_, index) => index + 1);
                                
                                    // Calculate availableSeats by subtracting bookedSeats from totalSeats
                                    const bookedSeats = bus.booked_seat;
                                    const availableSeats = totalSeatsArray.filter(seat => !bookedSeats.includes(seat));
                                
                                    res.status(200).json({
                                      success: true,
                                      message: 'Seat information for the bus',
                                      Seat_Info: {
                                        totalSeats: totalSeatsArray,
                                        availableSeats,
                                        bookedSeats,
                                      },
                                    });
                                  } catch (error) {
                                    console.error(error);
                                    res.status(500).json({ success: false, error: 'Error while fetching seat information' });
                                  }
                                }
   // APi for calculateFareFor selected seats in Bus 
                            
                            const calculateFareForSelectedSeats = async (req, res) => {
                              try {
                                const busId = req.params.busId;
                                const { selectedSeatNumbers, source, destination } = req.body;
                            
                                // Input Validation for selected seat numbers
                                if (!Array.isArray(selectedSeatNumbers) || selectedSeatNumbers.length === 0) {
                                  return res.status(400).json({ error: 'Invalid or empty selected seat numbers', success: false });
                                }
                            
                                // Access the bus route and available seats from the Database
                                const bus = await BusModel.findById(busId);
                            
                                if (!bus) {
                                  return res.status(404).json({ success: false, error: 'Bus not found' });
                                }
                            
                                const availableSeats = bus.Available_seat || [];
                            
                                // Check if selected bus seats are valid and available
                                const invalidSeatNumbers = selectedSeatNumbers.filter(seatNumber => !availableSeats.includes(seatNumber));
                            
                                if (invalidSeatNumbers.length > 0) {
                                  return res.status(400).json({
                                    success: false,
                                    error: 'Selected seat numbers are invalid or not available',
                                    invalidSeatNumbers,
                                  });
                                }
                            
                                // Access the stops from the bus route
                                const stops = bus.stops || []; 
                            
                                // Find the source and destination stops
                                const sourceStop = stops.find(stop => stop.stopName === source);
                                const destinationStop = stops.find(stop => stop.stopName === destination);
                            
                                if (!sourceStop || !destinationStop) {
                                  return res.status(400).json({
                                    success: false,
                                    error: 'Source or destination stop not found',
                                  });
                                }
                            
                                // Calculate the distance between source and destination stops
                                const distance = calculateDistanceBetweenStops(stops, sourceStop, destinationStop);
                            
                                // Check the bus type and set farePerUnitDistance accordingly
                                let farePerUnitDistance;
                            
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
                                  bordingPoint :source ,
                                  droppingPoint : destination ,
                                  seatNumber : selectedSeatNumbers,
                                  totalFare
                                 
                                });
                              } catch (error) {
                                console.error(error);
                                return res.status(500).json({ success: false, error: 'An error occurred while calculating fare' });
                              }
                            };
                            
                            // Helper function to calculate distance between stops
                            function calculateDistanceBetweenStops(stops, sourceStop, destinationStop) {
                              const sourceIndex = stops.indexOf(sourceStop);
                              const destinationIndex = stops.indexOf(destinationStop);
                            
                              if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex >= destinationIndex) {
                                return 0;
                              }
                            
                              let distance = 0;
                              for (let i = sourceIndex; i < destinationIndex; i++) {
                                distance += stops[i + 1].distance - stops[i].distance;
                              }
                            
                              return distance;
                            }
                            

  
  
          
                

                    
    
                
    module.exports = { 
                        adminLogin , changePassword, addBus , updateBus ,
                        deleteBus, allBuses ,getBus, addRoute , allroutes , editRoute, addBusId,
                        deleteBusId,deleteRoute  , searchBuses , addStop , editStop ,
                        addStopBeforeStop, allStops ,deleteStop ,calculateStopfare, 
                        changeProfile , addDriver ,editDriver,deleteDriver , allDrivers ,
                         getDriver , bookTicket, cancelTicket, userTickets , modifyTicket , allBookings,
                         countBookings , viewSeats ,calculateFareForSelectedSeats 
                     }
                    