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
         router.put('/editBus/:id',upload.array('images',15), adminController.editBus)
//Api for get AllBuses with there status
        router.get('/allBuses', adminController.allBuses)
module.exports = router
                              
                                  /*   Admin Manage Route */
//Api for add new Route 
router.post('/addRoute', adminController.addRoute)