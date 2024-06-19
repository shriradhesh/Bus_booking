const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel'      
    },  
    userEmail : {
        type : String
    },

    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TripModel', 
        required: true, 
    },
    return_tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TripModel', 
        
    },
    
       tripNumber : {
         type : String
       },

    date: {
        type: Date,
        required: true,
    },

    return_date: {
        type: Date,
      
    },

    selectedSeatNumbers: [{
        type: Number,
        required: true,
    }],
    
    return_SeatNumbers: [{
        type: Number,
       
    }],

    totalFare: {
        type: Number,
    },

    status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled' , 'cancel'],
        default: 'pending',
    },

    // paymentMethod: {
    //     type: String,
    // },

    paymentStatus: {
        type: String,
        enum: ['success', 'pending', 'failed'],
       
    },
 
    bookingId: {
        type: String,
    },
    source: {
        type: String,
    },
    destination: {
        type: String,
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
                enum: ['male', 'female', 'other' , 'Male' , 'Female'],
            },
            seatNumber: {
                type: Number,
                required: false,
            },
            ageGroup: {
                type: String,
                enum: ['baby', 'children', 'adult'],
                default: 'adult',
            },
        }
    ],

}, {
    timestamps: true,
});

const BookingModel = mongoose.model('BookingModel', bookingSchema);

module.exports = BookingModel;
