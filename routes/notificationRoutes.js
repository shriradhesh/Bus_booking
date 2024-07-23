const express = require('express')
const router = express.Router()
const notifcationController = require('../controller/notificationController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');  
           
                                      /* Notifications  */

// API for get notifcation of the user
router.get('/getNotification/:userId', notifcationController.getNotification)
// APi for get unseen notification
         router.get('/notificationCount/:userId', notifcationController.notificationCount)
           
// // APi for change notification status
//          router.post('/changeNotificationStatus/:notificationId', adminController.changeNotificationStatus)
// API for get Admin notification 
         router.get('/getAdminNotification/:adminId', notifcationController.getAdminNotification)
// APi to send Notification to trip user
         router.post('/sendNotification_to_tripUsers' , notifcationController.sendNotification_to_tripUsers)

// APi for send notification to all user
         router.post('/sendNotification_to_allUser', notifcationController.sendNotification_to_allUser)
// API for combine APi for send notification
         router.post('/sendNotifications', notifcationController.sendNotifications)
// API for get user Notification 
         router.get('/getAll_Users_Notificatation', notifcationController.getAll_Users_Notificatation)
// API for delete all Notification

         router.delete('/deleteAllUserNotifications', notifcationController.deleteAllUserNotifications)
// APi for delete particular notification by Id
         router.delete('/deleteNotifcationById/:notificationId' , notifcationController.deleteNotifcationById)
// API for delete particular feedback
        router.delete('/deleteFeedback/:feedbackId', notifcationController.deleteFeedback)
// Api for seenUserNotification
        router.post("/seenUserNotification/:notification_id", notifcationController.seenUserNotification)



        module.exports = router