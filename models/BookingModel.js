const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel'      
    },  

    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
      },
      date :{
        type : Date,
      },

   selectedSeatNumbers: [{
    type : Number,
    required : true
        }],

    totalFare : {
        type : Number
        
    },    
    status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'confirmed'
    },
         paymentMethod : {
            type : String 
           
         },

    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending'
    },   
    bookingId: {
        type: String
    },
    passengers: [
        {
            name: {
                type: String,
            },
            age: {
                type: Number,
            },
            gender: {
                type: String,
                enum: ['male', 'female', 'other'],
            },
            seatNumber :{
                type : Number,
                required: false 
            },
            ageGroup: {
                type: String,
                enum: ['baby', 'children', 'adult'],
                default: 'adult'
            }
        }
    ],
    
}, 
{
    timestamps: true,
    });

const BookingModel = mongoose.model('BookingModel', bookingSchema);

module.exports = BookingModel;
