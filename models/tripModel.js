const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber : {
        type : Number,
        required : true
    },
 startingDate: {
        type: Date,
        required: true,
      },
  
 endDate: {
        type: Date,
        required: true,
      },
  bus_no : {
    type: String,
    ref: 'BusModel',
    required: true,
  },
  driverId: {
    type: String,
    ref: 'DriverModel',
    required: true,
  },
  routeNumber:
  {
    type: Number,
    ref: 'DriverModel',
    required: true,
  },

  startingTime: {
    type: String,    
  },
  
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  Available_seat : [{
    type : Number,
    min : 0,      
  },],

  booked_seat : [{
    type : Number,       
  }],
 
}, { timestamps: true });

const TripModel = mongoose.model('TripModel', tripSchema);

module.exports = TripModel;
