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
    busId :{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusModel', 
      required: false
    },
    contact_no : { 
        type : String,
       required : true,
     },
     stops:[{
              stopName : {
                type : String,
                required : true
              },
              arrivalTime : {
                type : String,
                required :true,
              },            
              departureTime:{
                type: String,
                required : true,
              },
              distance: {
                type: Number,  
                required: true,
              },
             
     }],
     live_Location :
     {
        type : String,
        required : true,
     },     
    
     status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active', 
      },
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DriverModel', 
        required: false
    }
},
{timestamps: true}
)

const BusRoute= mongoose.model('BusRoute', busRouteSchema);

module.exports = BusRoute;
