const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')


            /* ==>   Admin Api's    <== */


// admin login
        router.post('/adminLogin',adminController.adminLogin)

//admin changePass
         router.post('/changePass', adminController.changePassword)

                            /* admin Manage Routes */
// APi for create Route

        router.post('/bus-routes')


module.exports = router
    