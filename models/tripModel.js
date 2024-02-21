const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: {
    type: String,
    required: true,
  },
  startingDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  bus_no: {
    type: String,
    ref: 'BusModel',
    required: true,
  },
  driverId: {
    type: String,
    ref: 'DriverModel',
    required: true,
  },
  routeNumber: {
    type: Number,
    required: true,
  },
  source: String,
  destination: String,
  startingTime: {
    type: String,
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  Available_seat: [{
    type: Number,
    min: 0,
  }],
  stops: [
    {
      stopName: {
        type: String,
      },
      EstimatedTimeTaken: {
        type: String,
      },
      stop_halt: {
        type: String,
        default: "0 Hour, 00 Minute"
      },
      distance: {
        type: Number,
      },
      stop_status: {
        type: Number,
        enum: [0, 1],
        default: 0,
      },
    },
  ],
  booked_seat: [{
    type: Number,
  }],
  bus_type: String,
  amenities: [String],
  images: [String],
  totalDuration: String,
  seating_capacity: {
    type: Number,
    required: true,
  },
  backSeat_capacity: {
    type: Number,
  },
  bus_category: {
    type: String,
  },
  eur_per_five_km: {
    type: Number,
  }
}, { timestamps: true });

const TripModel = mongoose.model('TripModel', tripSchema);

module.exports = TripModel;
