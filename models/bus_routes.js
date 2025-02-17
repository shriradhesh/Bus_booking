const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
  s_no: {
    type: Number,
  },
  routeNumber: {
    type: Number,
    required: true,
  },
  source: String,
  destination: String,
  stops: [
    {
      stopName: {
        type: String,
      },
       EstimatedTimeTaken: {
        type: String, 
      },
      // departure_time: {
      //   type: String, 
      // },
      distance: {
        type: Number,
      },
    },
  ],
  status: {
    type: String,
    enum: ['active', 'inactive', 'Active' , 'Inactive'],
    default: 'active',
  },
}, { timestamps: true });

const BusRoute = mongoose.model('BusRoute', busRouteSchema);

module.exports = BusRoute;
