const express = require('express')
const router = express.Router()
const busController = require('../controller/BusController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');


                             /* admin Manage Buses*/
// APi for add new bus

router.post('/add_Bus', upload.array('images',15),busController.addBus)
// Api for edit bus
         router.put('/updateBus/:id', upload.array('images',15), busController.updateBus)
//Api for delete Bus
          router.delete('/deleteBus/:busId', busController.deleteBus)
//Api for get AllBuses with there status
        router.get('/allBuses', busController.allBuses)
// APi for get a Bus by busID
        router.post('/getBus',busController.getBus)
// Api for deleteBusImageByIndex
         router.delete('/deleteBusImageByIndex/:busId', busController.deleteBusImageByIndex)


        module.exports = router