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
        type: String,
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
    }
});

const BookingModel = mongoose.model('BookingModel', bookingSchema);

module.exports = BookingModel;
