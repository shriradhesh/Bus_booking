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

// user change password

router.post('/userChangePass', userController.userChangePass)

 // forget password Api -- 
                          //password reset link sent to user email account and token generate 

 router.post('/forgetPassToken', userController.forgetPassToken)

                        // reset password and token verify

  router.post('/resetPassword/:userId/:token', userController.userResetPass)

                          /*  Manage profile */

 //update profile by id
 router.put('/updateUser/:id', upload.single('profileImage'), userController.updateUser)
  module.exports = router