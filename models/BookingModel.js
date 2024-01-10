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
    tripNumber :
    {
        type : Number
    },
    

    date: {
        type: Date,
        required: true,
    },

    selectedSeatNumbers: [{
        type: Number,
        required: true,
    }],

    totalFare: {
        type: Number,
    },

    status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'confirmed',
    },

    // paymentMethod: {
    //     type: String,
    // },

    paymentStatus: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        default: 'success',
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
