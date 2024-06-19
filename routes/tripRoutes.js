const express = require('express')
const router = express.Router()
const tripController = require('../controller/tripController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');



// Api for create a trip 
            router.post('/createTrip', tripController.createTrip)
// Api for update Trip
            router.put('/updateTrip/:tripId',tripController.updateTrip )
// Api to get all trips on particualr startingDate
          router.get('/allTrips', tripController.allTrips)
// Api for get Trip
          router.get('/getTrip/:tripId', tripController.getTrip)
// Api for get a Trip for desired source , destination and Date
          router.post('/searchTrips',tripController.searchTrips)
// Api for RoundTrip
          router.post('/RoundTrip', tripController.RoundTrip)
// Api for view seats in Bus for a Route
           router.post('/viewSeats', tripController.viewSeats)
// Api for calculate Fare For SelectedSeats in a Bus
           router.post('/calculateFareForSelectedSeats/:tripId', tripController.calculateFareForSelectedSeats)
// Api for filter trip
            router.post('/filter-trips', tripController.filterTrips);
// Api for Modify Ticket (departure date)
            router.post('/getUpcomingTrip_for_DateChange', tripController.getUpcomingTrip_for_DateChange)
 // Api for change Trip 
             router.post('/changeTrip', tripController.changeTrip)
    // track BUS
 //API for change stop status
            router.post('/change_trips_stop_status/:tripId/:stopId' , tripController.change_trips_stop_status)
 // API to get stops of trip
           router.get('/getTripStops/:tripId', tripController.getTripStops)
     // API for cancelled trip
             router.post('/cancelTrip/:tripId', tripController.cancelTrip)
// Api for add Halt on particular stop in a trip
        router.post('/add_Halt_on_stop/:tripId', tripController.add_Halt_on_stop)



          module.exports = router