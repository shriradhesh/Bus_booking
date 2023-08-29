const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
         ref : 'UserModel',
          required: true
    },
    routeNumber: {
        type : Number,
        required: true
    },
    seatNumber: {
        type: Number,
       
    },
    departureDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: [ 'confirmed', 'pending','cancelled'],
        default: 'confirmed'
    },
    paymentToken : {
        type : String,
        
    },
    paymentStatus : {
        type : String,
        enum : ['paid' , 'pending' , 'failed'],
        default : 'pending'
    },
    tickitPrice : {
        type : Number
    
    },
    bookingId :{
        type : String
    },
    passengers : [{
               name :{
                type : String,
                
               },
               age : {
                type :  Number ,
              
               },
               gender : {
                type : String,
                enum : ['male', 'female', 'other'],
               
               },
               seatNumber : {
                type : Number,
                
               }
               
    }]

} ,{
Timestamps : true,


indexes: [
    { unique: true, fields: ['seatNumber', 'routeNumber', 'departureDate'] }
]
});

const BookingModel = mongoose.model('BookingModel', bookingSchema);

module.exports = BookingModel;
