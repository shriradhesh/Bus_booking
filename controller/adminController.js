const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Admin = require('../models/adminModel')
const changePass  = require('../models/changePassword')
const BusModel = require('../models/busModel')
const upload = require('../uploadImage')
const BusRoute = require('../models/bus_routes')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const { error } = require('console')

                      /* -->  ADMIN Api'S   <--    */

//admin login API
    
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
  
      if (!bus_type || !seating_capacity || !bus_no || !model || !manufacture_year || !amenities || !depot_station) {
        return res.status(400).json({ error: 'Missing required Field ', success: false });
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
                            bus_no,
                            model,
                            manufacture_year,
                            amenities,
                            depot_station,
                            status
                        } = req.body
                    
                        if (!bus_type || !seating_capacity || !bus_no || !model || !manufacture_year || !amenities || !depot_station || !status) {
                            return res.status(400).json({ error: 'Missing required Field ', success: false });
                        }
                    
                        // Check if the bus with the given id exists
                        const existBus = await BusModel.findOne({ _id:id  });
                        if (!existBus) {
                            return res.status(400).json({ error: ' Bus Not found ', success: false });
                        }
                    
                        //update the properties
                        existBus.bus_type = bus_type;
                        existBus.seating_capacity = seating_capacity;
                        existBus.bus_no = bus_no;
                        existBus.model = model;
                        existBus.manufacture_year = manufacture_year;
                        existBus.amenities = amenities;
                        existBus.depot_station = depot_station;
                        existBus.status = status;
                                           
                        if (req.file) {
                            existBus.images = req.file.path;
                        }
                    
                        // Save the data into the database
                        const updatedBus = await existBus.save();
                        res.status(200).json({ success: true, message: ' Bus Details Edit Successfully', bus: updatedBus });
                        } catch (error) {
                            console.error(error);
                        res.status(500).json({ success: false, error: 'Error while editing the bus details' });
                        }
                    };
                    
//Api for Get All Buses with there status 
                const allBuses = async (req, res) => {
                    try {
                   
                    const status = req.query.status;
                
                    let Buses;
                    if (status === 'active' || status === 'inactive') {
                        Buses = await BusModel.find({ status: status });
                    } else {
                          Buses = await BusModel.find({});
                    }
                
                    res.status(200).json({success: true , message: 'All Buses', Bus_Detail : Buses });
                    } catch (err) {
                    res.status(500).json({success : false, error: 'There is an error to find Buses' , error : error});
                    }
                };
             


                                                    /* Route Management */

            // Api for Add Route
                  const addRoute = async(req,res)=>{
                    try{
                        const {
                           routeNumber,
                            startingPoint ,
                            endPoint,                        
                            stops,
                            schedule,
                            distances
                        } = req.body
               
                        if (!routeNumber || !startingPoint || !endPoint || !stops || !schedule || !distances) {
                            return res.status(400).json({ error: 'Missing required Field ', success: false });
                          }

                        // Check for route Number
                        const existRoute = await BusRoute.findOne({ routeNumber });
                    
                        if (existRoute) {
                            return res.status(400).json({ error: 'Route with the same Route Number is Already Exist', success: false });
                        }
                        const newRoute = new BusRoute({
                            routeNumber: routeNumber,
                            startingPoint: startingPoint,
                            endPoint: endPoint,
                            stops: stops,
                            schedule: schedule,
                            distances: distances,
                            
                        });
                    const savedRoute = await newRoute.save();
                        res.status(200).json({ success: true, message: 'New Route Added successfully', Bus: savedRoute });
                                }
                                catch(error)
                                {
                                
                                res.status(500).json({ success: false, message: 'Error while adding the Route ', error: error });
                                }
                            }     
                            
                            
                                    
    module.exports = {adminLogin , changePassword, addBus , editBus , allBuses , addRoute}