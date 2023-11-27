const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')
const upload = require('../uploadImage')
const multer = require('multer')

                    /*   --> USER API <--   */ 

// user Register 

router.post('/register', userController.userRegister )

// user login by id

router.post('/login', userController.loginUser)
// user logoutUser user 

router.post('/logoutUser', userController.logoutUser)

// user change password

router.post('/userChangePass', userController.userChangePass)

 // forget password Api -- 
                          //otp send  to user email account  

 router.post('/forgetPassOTP', userController.forgetPassOTP)

                          // verify OTP
router.post('/verifyOTP', userController.verifyOTP) 

                        // reset password and token verify

  router.post('/resetPassword/:userId', userController.userResetPass)

                          /*  Manage profile */

 //update profile by id
 router.put('/updateUser/:id', upload.single('profileImage'), userController.updateUser)

 // get user by Email
router.get('/getUser/:email', userController.getUser) 
 // delete User 
      router.delete('/deleteUser/:userId',userController.deleteUser)

                       
                                  /*      see Routes      */
// APi for seeRoutes                              
router.get('/seeRoutes',userController.seeRoutes)
 
                               /*  Booking */


//Api for get upcoming Booking 
router.get('/upcoming_Booking/:userId',userController.upcoming_Booking)

// Api for get Booking History
router.post('/bookingHistory/:userId',userController.bookingHistory)

// Api for feedback
router.post('/contactUs', userController.contactUs)

//API for get all feedback
router.get('/allFeedback', userController.allFeedback)

// Subscribe to push notification

router.post('/subscribe', userController.subscribeToPushNotifications)



                           


    module.exports = router