const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')


            /* ==>   Admin Api's    <== */


// admin login
        router.post('/adminLogin',adminController.adminLogin)


module.exports = router
    