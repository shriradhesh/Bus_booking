const express = require('express')
const router = express.Router()
const driverController = require('../controller/DriverController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');




                               /* Admin Manage Drivers */
// Api for add Driver 
router.post('/addDriver',upload.single('driverProfileImage'), driverController.addDriver)
// Api for edit Driver Details
        router.put('/editDriver/:driverId',upload.single('driverProfileImage'), driverController.editDriver)
// Api for delete Driver
        router.delete('/deleteDriver/:driverId',driverController.deleteDriver)
// Api for all Drivers
        router.get('/allDrivers', driverController.allDrivers)
// Api for get a Driver by driver id
        router.get('/getDriver/:driverId', driverController.getDriver)



        module.exports = router