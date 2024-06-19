const express = require('express')
const router = express.Router()
const transactionController = require('../controller/transactionController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');              
                      /*  transaction Manage */
// Api for get all transaction on Date
router.post('/All_Transaction', transactionController.All_Transaction)
// APi for get total transaction Amount
router.get('/totalTransactionAmount', transactionController.totalTransactionAmount)
// Api for get tranaction by booking Id
        router.get('/getTransaction_by_bookingId', transactionController.getTransaction_by_bookingId)
     
// APi for getAllDetailsCount
           router.get('/getAllDetailsCount', transactionController.getAllDetailsCount)
// APi for delete all transaction
           router.delete('/deleteAlltransaction', transactionController.deleteAlltransaction)


    module.exports = router

                          