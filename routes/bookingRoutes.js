const express = require('express')
const router = express.Router()
const bookingController = require('../controller/bookingController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');


 //Api for Book Tickit
   router.post('/bookTicket/:tripId', bookingController.bookTicket)
 // Api for updateBooking
         router.post('/updateBooking/:bookingId', bookingController.updateBooking)
  // Api for getBooking
         router.get('/getBooking/:bookingId', bookingController.getBooking)
 // Api for cancle tickit
         router.post('/cancelTicket',bookingController.cancelTicket)
// Api for refund for mtn and orange
         router.post('/refund_o_m/:bookingId', bookingController.refund_o_m)
 // APi for get all tickets of user 
         router.get('/userTickets/:userId', bookingController.userTickets)
 // Api for get all Tickits done by users
         router.get('/allBookings', bookingController.allBookings)
 // APi for count bookings for particular date
         router.get('/countBookings',bookingController.countBookings)
 // APi for get booking by tripNumber
        router.get('/getbooking_by_tripNumber', bookingController.getbooking_by_tripNumber)    
    // APi for get BookingModel trips
         router.get('/getBookingTrip', bookingController.getBookingTrip)
    // APi for get booking by Date
         router.get('/getBookings_By_Date', bookingController.getBookings_By_Date)



         



     

module.exports = router