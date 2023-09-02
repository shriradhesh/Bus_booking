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
//Api for add Stop in a Route with the help of bus id 
        router.post('/addStop/:busId',adminController.addStop)
//Api for edit Stop in a Route with the help of stop id and busId
        router.put('/editStop/:stopId/:busId',adminController.editStop)
// Api to add stop before the stop
         router.post('/addStopBeforeStop/:busId', adminController.addStopBeforeStop)
// Api for get all stops in a bus
        router.get('/allStops/:busId', adminController.allStops)
// Api for delete a stop by stop id and bus id
        router.delete('/deleteStop/:stopId/:busId', adminController.deleteStop)
//Api for assign stop price
        router.post('/calculateStopfare/:busId', adminController.calculateStopfare)


                              
                                  /*   Admin Manage Route */
//Api for add new Route 
        router.post('/addRoute', adminController.addRoute)
// Api for get all Route
        router.get('/allRoute',adminController.allroutes)
//Api for edit Route details by id
        router.put('/editRoute/:routeId',adminController.editRoute)
//Api for add BusId in a Route
        router.post('/addBusId/:routeId',adminController.addBusId) 
//Api for add BusId in a Route
        router.delete('/deleteBusId/:Id/:routeId',adminController.deleteBusId) 
//Api for delete Route by id
        router.delete('/deleteRoute/:routeId', adminController.deleteRoute)
//Api for get a Route by  routeId
        router.get('/searchBuses',adminController.searchBuses)


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


                                     /*  Tickit Manage  */
//Api for Book Tickit
        router.post('/bookTicket',adminController.bookTicket)
// Api for cancle tickit
        router.post('/cancelTicket',adminController.cancelTicket)
// APi for get all tickets of user 
        router.get('/userTickets/:userId', adminController.userTickets)
// Api for Modify Ticket (departure date)
        router.post('/modifyTicket', adminController.modifyTicket)
                                 
                                        /*  Booking Manage */
// Api for get all Tickits done by users
        router.get('/allBookings', adminController.allBookings)
// APi for count bookings for particular date
        router.get('/countBookings',adminController.countBookings)
// Api for view seats in Bus for a Route
        router.get('/viewSeats/:busId', adminController.viewSeats)

                                   
                                     


module.exports = router