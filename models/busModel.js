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
    
  bus_no: {
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
    
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: true, 
      default :'active'
    },
    availability: {
      type: String,
      enum: ['available', 'booked', 'unavailable'],
      required: true,
      default : 'available'

    },
    
  },
    {timestamps: true}
     
    )

    const BusModel = mongoose.model('BusModel', busSchema);

    module.exports = BusModel