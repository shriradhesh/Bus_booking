const express = require('express')
const router = express.Router()
const import_exportController = require('../controller/Import_exportController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');
const { ResourceAlreadyExistError } = require('mtn-momo')


                                  /* Import and Export */
// Api for import Buses data
          router.post('/import_Buses', upload.single('file') , import_exportController.import_Buses)
// Api for download sample file for buses
         router.get('/generate_sampleFile', import_exportController.generate_sampleFile)
// Api for export bookings 
         router.get('/export_Bookings' , import_exportController.export_Bookings)
// Api for export transaction
          router.get('/export_Transactions' , import_exportController.export_Transactions)
// Api for export transaction
          router.get('/export_Trips' , import_exportController.export_Trips)
// Api for export transaction
          router.get('/export_Users' , import_exportController.export_Users)


module.exports = router
