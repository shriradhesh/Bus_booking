const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    seatNumber: {
        type: Number,
        required: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: [ 'confirmed', 'pending','canceled'],
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
    }

});

const BookingModel = mongoose.model('BookingModel', bookingSchema);

module.exports = BookingModel;
