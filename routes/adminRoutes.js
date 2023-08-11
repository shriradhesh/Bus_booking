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
         router.post('/changePass', adminController.changePassword)

                            /* admin Manage Buses*/
// APi for add new bus

        router.post('/add_Bus', upload.array('images',15),adminController.addBus)
// Api for edit bus
         router.put('/editBus/:id', upload.array('images',15), adminController.editBus)
//Api for get AllBuses with there status
        router.get('/allBuses', adminController.allBuses)


                              
                                  /*   Admin Manage Route */
//Api for add new Route 
router.post('/addRoute', adminController.addRoute)
// Api for get all Route
router.get('/allRoute',adminController.allroutes)
//Api for edit Route details by id
router.put('/editRoute/:id',adminController.editRoute)
//Api for delete Route by id
router.delete('/deleteRoute/:id', adminController.deleteRoute)
//Api for add Stop in a Route with the help of Route id 
router.post('/addStop/:routeId',adminController.addStop)
//Api for edit Stop in a Route with the help of stop id and routeId
router.put('/editStop/:stopId/:routeId',adminController.editStop)
// Api for get all stops in a route
router.get('/allStops/:routeId', adminController.allStops)
// Api for delete a stop by stop id and route id
router.delete('/deleteStop/:stopId/:routeId', adminController.deleteStop)

                                /* Admin change Profile */
//Api for change Admin Profile

router.put('/changeprofile/:AdminId',upload.single('profileImage'), adminController.changeProfile)

module.exports = router