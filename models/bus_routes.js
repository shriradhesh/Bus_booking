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
