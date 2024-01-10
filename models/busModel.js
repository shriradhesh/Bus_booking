const mongoose = require('mongoose')
const busSchema = new mongoose.Schema({
  bus_category : {
    type : String,
    required : true,
  },
  bus_type:{
    type : String,
    required : true,
  },
  seating_capacity: {
    type : Number,
    required : true,
  },   
  backSeat_capacity :
  {
    type : Number
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

 amenities: [
  {
    amenities_Name: {
      type: String
    },    
  },
],

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