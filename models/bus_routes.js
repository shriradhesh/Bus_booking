const mongoose = require('mongoose')
const busRouteSchema = new mongoose.Schema({
   s_no:{
        type : Number
   },
    routeNumber:{
        type : Number,
        required : true,
    },
    routeName: {
        type : String,
        required : true,
    },
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
        type : String,
        required : true,
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
              stop_time : {
                type : String,
                required :true,
              },
              stop_actualTime:
              {
                type: String,
                required : true,
              }

     }],
     live_Location :
     {
        type : String,
        required : true,
     },
     delay : {
        type : Number 
        
     },
     status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active', 
      }
},
{timestamps: true}
)

const BusRoute= mongoose.model('BusRoute', busRouteSchema);

module.exports = BusRoute;
