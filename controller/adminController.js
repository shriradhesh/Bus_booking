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
const fs = require('fs');



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
  
      if (!bus_type) 
      { 
        return res.status(400).json({ error: 'Missing bus type ', success: false });
      }
      if (!seating_capacity) 
      { 
        return res.status(400).json({ error: 'Missing seating_capacity  ', success: false });
      }
      if (!bus_no) 
      { 
        return res.status(400).json({ error: 'Missing bus_no field', success: false });
      }
      if (!model) 
      { 
        return res.status(400).json({ error: 'Missing model field ', success: false });
      }
      if (!manufacture_year) 
      { 
        return res.status(400).json({ error: 'Missing manufacture_year field ', success: false });
      }
      if (!amenities) 
      { 
        return res.status(400).json({ error: 'Missing amenities ', success: false });
      }
      if (!depot_station) 
      { 
        return res.status(400).json({ error: 'Missing depot_station ', success: false });
      }
      if (!status) 
      { 
        return res.status(400).json({ error: 'Missing status', success: false });
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
                    
                        if (!bus_type) 
      { 
        return res.status(400).json({ error: 'Missing bus type ', success: false });
      }
      if (!seating_capacity) 
      { 
        return res.status(400).json({ error: 'Missing seating_capacity  ', success: false });
      }
      if (!bus_no) 
      { 
        return res.status(400).json({ error: 'Missing bus_no field', success: false });
      }
      if (!model) 
      { 
        return res.status(400).json({ error: 'Missing model field ', success: false });
      }
      if (!manufacture_year) 
      { 
        return res.status(400).json({ error: 'Missing manufacture_year field ', success: false });
      }
      if (!amenities) 
      { 
        return res.status(400).json({ error: 'Missing amenities ', success: false });
      }
      if (!depot_station) 
      { 
        return res.status(400).json({ error: 'Missing depot_station ', success: false });
      }
      if (!status) 
      { 
        return res.status(400).json({ error: 'Missing status', success: false });
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
                              if(existBus.images)
                              {
                                try{
                                  fd.unlinkSync(existBus.images)
                                }catch(error)
                                {
                                  console.error('Error deleting previous image:', error);
                                }
                              }
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
                    } catch (error) {
                    res.status(500).json({success : false, error: 'There is an error to find Buses' + error.message});
                    }
                }
             


                                                    /* Route Management */

// Api for Add Route
                 
                  const addRoute = async(req,res)=>{
               try{
                    const { s_no , routeNumber ,routeName ,
                         starting_Date , end_Date , starting_time , 
                         end_time , busId , contact_no, live_Location  ,status , stops} = req.body
                  
                   
                    
                           // check field validation
                           if(!s_no)
                           { 
                            return res.status(400).json({ error: 'Missing serial no ', success: false });
                          }
                          if (!routeNumber) 
                          { 
                            return res.status(400).json({ error: 'Missing routeNumber  ', success: false });
                          }
                          if (!routeName) 
                          { 
                            return res.status(400).json({ error: 'Missing routeName', success: false });
                          }
                          if (!starting_Date) 
                          { 
                            return res.status(400).json({ error: 'Missing starting_Date ', success: false });
                          }
                          if (!end_Date) 
                          { 
                            return res.status(400).json({ error: 'Missing end_Date ', success: false });
                          }
                          if (!starting_time) 
                          { 
                            return res.status(400).json({ error: 'Missing starting_time ', success: false });
                          }
                          if (!end_time) 
                          { 
                            return res.status(400).json({ error: 'Missing end_time ', success: false });
                          }
                          if (!busId) 
                          { 
                            return res.status(400).json({ error: 'Missing busId', success: false });
                          }
                      
                          if (!contact_no) 
                          { 
                            return res.status(400).json({ error: 'Missing contact_no', success: false });
                          }
                      
                          if (!live_Location) 
                          { 
                            return res.status(400).json({ error: 'Missing busId', success: false });
                          }   
                          if (!status) 
                          { 
                            return res.status(400).json({ error: 'Missing status', success: false });
                          }
                          if (!stops) 
                          { 
                            return res.status(400).json({ error: 'Missing stops', success: false });
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
                        routeName : routeName,
                        starting_Date: starting_Date,
                        end_Date: end_Date,
                        starting_time: starting_time,
                        end_time : end_time,
                        busId : busId,
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
                            const id = req.params.id;
                            const {
                                routeNumber,
                                routeName,
                                starting_Date,
                                end_Date,
                                starting_time,
                                end_time,
                                busId,
                                contact_no,
                                live_Location,
                                delay,
                                status,
                               
                            } = req.body

                            if (!routeNumber) 
                          { 
                            return res.status(400).json({ error: 'Missing routeNumber  ', success: false });
                          }
                          if (!routeName) 
                          { 
                            return res.status(400).json({ error: 'Missing routeName', success: false });
                          }
                          if (!starting_Date) 
                          { 
                            return res.status(400).json({ error: 'Missing starting_Date ', success: false });
                          }
                          if (!end_Date) 
                          { 
                            return res.status(400).json({ error: 'Missing end_Date ', success: false });
                          }
                          if (!starting_time) 
                          { 
                            return res.status(400).json({ error: 'Missing starting_time ', success: false });
                          }
                          if (!end_time) 
                          { 
                            return res.status(400).json({ error: 'Missing end_time ', success: false });
                          }
                          if (!busId) 
                          { 
                            return res.status(400).json({ error: 'Missing busId', success: false });
                          }
                      
                          if (!contact_no) 
                          { 
                            return res.status(400).json({ error: 'Missing contact_no', success: false });
                          }
                      
                          if (!live_Location) 
                          { 
                            return res.status(400).json({ error: 'Missing busId', success: false });
                          }   
                          if (!status) 
                          { 
                            return res.status(400).json({ error: 'Missing status', success: false });
                          }
                         
                           
                           // check for route existance 
                         
                    const existRoute = await BusRoute.findOne({_id:id})
                    if(!existRoute)
                    {
                        
                      return res.status(404).json({ success : false ,  error : `route not found `})
                    }
                    
                    
                        //update the properties
                        existRoute.routeNumber = routeNumber;
                        existRoute.routeName = routeName;
                        existRoute.starting_Date = starting_Date;
                        existRoute.end_Date = end_Date;
                        existRoute.starting_time = starting_time;
                        existRoute.end_time = end_time;
                        existRoute.busId = busId;
                        existRoute.contact_no = contact_no;
                        existRoute.live_Location = live_Location;                        
                        existRoute.status = status;
                      
                          
                       
   
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
      
     
      //API for add stop in a route with route id 

           const addStop = async (req,res)=>{
          
            const routeId = req.params.routeId
           const {stopName , stop_time, stop_actualTime} = req.body
          
            
           try{

            if (!stopName)
            { 
                 
              return res.status(400).json({ error: 'Missing stopName  ', success: false });
            }
            if (!stop_time) 
            { 
              return res.status(400).json({ error: 'Missing stop_time', success: false });
            }
            if (!stop_actualTime) 
            { 
              return res.status(400).json({ error: 'Missing stop_actualTime ', success: false });
            }
            
                const route = await BusRoute.findOne({ _id:routeId })
           
                if(!route)
                {
                    return res.status(400).json({ success : false , error : `Route not found with the routeId ${routeId}`})
                }

                route.stops.push({
                    stopName,
                    stop_time,
                    stop_actualTime
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
              stop_time,
              stop_actualTime
            } = req.body
            if(!stopName)
            {
              return res.status(400).json({ success : false , error : 'Missing stopName'})
            }
            if(!stop_time)
            {
              return res.status(400).json({ success : false , error : 'Missing stop_time'})
            }
            if(!stop_actualTime)
            {
              return res.status(400).json({ success : false , error : 'Missing stop_time'})
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
                      existStop.stop_time = stop_time
                      existStop.stop_actualTime = stop_actualTime
                       
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

    module.exports = {adminLogin , changePassword, addBus , editBus ,
                        allBuses , addRoute , allroutes , editRoute,
                      deleteRoute  , addStop , editStop , allStops , 
                        deleteStop , changeProfile
                    }