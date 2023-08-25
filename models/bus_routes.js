const mongoose = require('mongoose')
const busRouteSchema = new mongoose.Schema({
   s_no:{
        type : Number
   },
    routeNumber:{
        type : Number,
        required : true,
    },
    source :String,
    destination: String,
    starting_Date:{ 
        type : Date,
        required : true
               },
    end_Date: {
          type : Date, 
          required : true
    },
    starting_time : {
        type : String,
        required : true,
    },
    end_time :{
        type : String,
        required : true,
    },
    busInfo : [{
                  busId : {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'BusModel', 
                       
                }
              }],
    
    
    driverId:[ {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DriverModel', 
           
  }],
   
    contact_no : { 
        type : String,
       required : true,
     },
     stops:[{
              stopName : {
                type : String,
               
              },
              arrivalTime : {
                type : String,
                
              },            
              departureTime:{
                type: String,
                
              },
              distance: {
                type: Number,  
               
              },
             
     }],
     live_Location :
     {
        type : String,
        required : false,
     },     
    
     status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active', 
      },
     
    Date:{ 
      type : Date,     
             },

},
{timestamps: true}
)

const BusRoute= mongoose.model('BusRoute', busRouteSchema);

module.exports = BusRoute;
