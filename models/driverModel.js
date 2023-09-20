const mongoose = require('mongoose')
const driverSchema = new mongoose.Schema({
   
    driverId : {
      type : String,
      required : true,
      unique : true
    },
    driverName : {
        type : String,
        required : true,
    },
    driverContact : {
        type : Number,
        required : true,
    },
    driverLicence_number : {
        type : String,
        required : true,
        unique : true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: true, 
      default :'active'
    },
      driverProfileImage: {
        type: String,
        default: '',
      },
      availability: {
        type: String,
        enum: ['available', 'booked', 'unavailable'],
        required: true,
        default : 'available'
  
      },
    },


{timestamps: true})

const DriverModel = mongoose.model('DriverModel', driverSchema);

module.exports = DriverModel