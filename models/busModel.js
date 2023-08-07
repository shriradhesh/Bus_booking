const mongoose = require('mongoose')
const busSchema = new mongoose.Schema({
  bus_type:{
    type : String,
    required : true,
  },
  seating_capacity: {
    type : Number,
    required : true,
},
  registration_number: {
    type : String,
    required : true
},
  model: {
    type : String,
     required : true 
    },
  manufacture_year :{
    type : Number,
    required : true,
},
  amenities:{
   type :[String],
   required : true,
  },
  images:{
    type : [String],
    required : true,
  },
    depot_station: {
        type : String,
        required : true
    }
    })

    const BusModel = mongoose.model('BusModel', busSchema);

    module.exports = BusModel