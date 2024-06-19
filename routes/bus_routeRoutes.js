const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');
const busRouteController = require('../controller/busRouteController')

                                    /* STOP MANAGEMENT  */



//Api for add Stop in a stop Schema
router.post('/createStop', busRouteController.createStop)

// Api for get all stops in a Stop Schema 
        router.get('/allStops', busRouteController.allStops)
// Api for delete a stop by stop id and bus id
        router.delete('/deleteStop/:stopId', busRouteController.deleteStop)
           
        



                              
                                  /*   Admin Manage Route */
//Api for add new Route 
        router.post('/addRoute', busRouteController.addRoute)
// Api for get all Route
        router.get('/allRoute',busRouteController.allroutes)
//Api for edit Route details by id
        router.put('/editRoute/:routeId',busRouteController.editRoute)
//Api for delete Route by id
        router.delete('/deleteRoute/:routeId', busRouteController.deleteRoute)
//Api for add Stop in a route 
        router.post('/addStop_in_Route/:routeId',busRouteController.addStop_in_Route)
//Api for edit stop in a Route
        router.put('/editStop_in_Route/:stopId/:routeId', busRouteController.editStop_in_Route )
// Api to add stop before the stop in a Route 
        router.post('/addStopBeforeStop/:routeId', busRouteController.addStopBeforeStop)
// Api to add stop before the stop in a Route 
        router.delete('/deleteStop_in_Route/:stopId/:routeId', busRouteController.deleteStop_in_Route)
// Api for get all stops of a route
        router.get('/allStops_ofRoute/:routeId', busRouteController.allStops_ofRoute)



module.exports = router