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
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusModel',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriverModel',
    required: true,
  },
  routeId:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriverModel',
    required: true,
  },

  scheduled_DepartureTime: {
    type: Date,
    
  },
  scheduled_ArrivalTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
 
}, { timestamps: true });

const TripModel = mongoose.model('TripModel', tripSchema);

module.exports = TripModel;
