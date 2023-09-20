const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')






   

            /* ==>   Admin Api's    <== */


// admin login
        router.post('/adminLogin',adminController.adminLogin)

//admin changePass
         router.post('/changePass/:id', adminController.changePassword)

                            /* admin Manage Buses*/
// APi for add new bus

        router.post('/add_Bus', upload.array('images',15),adminController.addBus)
// Api for edit bus
         router.put('/updateBus/:id', upload.array('images',15), adminController.updateBus)
//Api for delete Bus
          router.delete('/deleteBus/:busId', adminController.deleteBus)
//Api for get AllBuses with there status
        router.get('/allBuses', adminController.allBuses)
// APi for get a Bus by busID
        router.get('/getBus/:busId',adminController.getBus)
                           
                             /* STOP MANAGEMENT  */



//Api for add Stop in a stop Schema
        router.post('/createStop',adminController.createStop)

// Api for get all stops in a Stop Schema 
        router.get('/allStops', adminController.allStops)
// Api for delete a stop by stop id and bus id
        router.delete('/deleteStop/:stopId', adminController.deleteStop)



                              
                                  /*   Admin Manage Route */
//Api for add new Route 
        router.post('/addRoute', adminController.addRoute)
// Api for get all Route
        router.get('/allRoute',adminController.allroutes)
//Api for edit Route details by id
        router.put('/editRoute/:routeId',adminController.editRoute)
//Api for delete Route by id
        router.delete('/deleteRoute/:routeId', adminController.deleteRoute)
//Api for add Stop in a route 
        router.post('/addStop_in_Route/:routeId',adminController.addStop_in_Route)
//Api for edit stop in a Route
        router.put('/editStop_in_Route/:stopId/:routeId', adminController.editStop_in_Route )
// Api to add stop before the stop in a Route 
        router.post('/addStopBeforeStop/:routeId', adminController.addStopBeforeStop)
// Api to add stop before the stop in a Route 
        router.delete('/deleteStop_in_Route/:stopId/:routeId', adminController.deleteStop_in_Route)


                                /* Admin change Profile */
//Api for change Admin Profile

        router.put('/changeprofile/:AdminId',upload.single('profileImage'), adminController.changeProfile)
                   
                               /* Admin Manage Drivers */
// Api for add Driver 
        router.post('/addDriver',upload.single('driverProfileImage'), adminController.addDriver)
// Api for edit Driver Details
        router.put('/editDriver/:driverId',upload.single('driverProfileImage'), adminController.editDriver)
// Api for delete Driver
        router.delete('/deleteDriver/:driverId',adminController.deleteDriver)
// Api for all Drivers
        router.get('/allDrivers', adminController.allDrivers)
// Api for get a Driver by driver id
        router.get('/getDriver/:driverId', adminController.getDriver)

                                                  /*  Trip Management  */
// Api for create a trip 
          router.post('/createTrip', adminController.createTrip)
// Api for get a Trip for desired source , destination and Date
          router.get('/searchTrips',adminController.searchTrips)
// Api for view seats in Bus for a Route
           router.get('/viewSeats/:tripId', adminController.viewSeats)
// Api for calculate Fare For SelectedSeats in a Bus
router.post('/calculateFareForSelectedSeats/:tripId', adminController.calculateFareForSelectedSeats)




                                     /*  Tickit Manage  */
//Api for Book Tickit
        router.post('/bookTicket/:tripId',adminController.bookTicket)
// Api for cancle tickit
        router.post('/cancelTicket/:tripId',adminController.cancelTicket)
// APi for get all tickets of user 
        router.get('/userTickets/:userId', adminController.userTickets)
// Api for Modify Ticket (departure date)
        router.get('/getUpcomingTrip_for_DateChange', adminController.getUpcomingTrip_for_DateChange)
// Api for change Trip 
        router.post('/changeTrip', adminController.changeTrip)
                                 
                                        /*  Booking Manage */
// Api for get all Tickits done by users
        router.get('/allBookings', adminController.allBookings)
// APi for count bookings for particular date
        router.get('/countBookings',adminController.countBookings)

// Api for traclBus
        router.get('/trackBus/:tripId', adminController.trackBus)


                                   
                                     


module.exports = router