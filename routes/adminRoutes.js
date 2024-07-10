const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const multer = require('multer')
const path = require('path')
const upload = require('../uploadImage')
const { sendUpcomingNotifications } = require('../controller/adminController');



            /* ==>   Admin Api's    <== */


// admin login
        router.post('/adminLogin',adminController.adminLogin)
// google login
        router.post('/googleLogin', adminController.googleLogin)

//admin changePass
         router.post('/changePass/:id', adminController.changePassword)                    
                               
//Api for change Admin Profile

        router.put('/changeprofile/:AdminId',upload.single('profileImage'), adminController.changeProfile)
// API for update Admin 
        router.post('/updateAdmin/:id',upload.single('profileImage'), adminController.updateAdmin)                           
 
// APi for get admin details
         router.get('/getAdminDetails', adminController.getAdminDetails)


                /* Promo code section */
// Api for create_promo_code
          router.post('/create_promo_code', adminController.create_promo_code)
// Api for get_promo_codes
          router.get('/get_promo_codes', adminController.get_promo_codes)
// Api for update_promo_code
          router.put('/update_promo_code/:promo_code_id', adminController.update_promo_code)
// Api for delete_promo_code
          router.delete('/delete_promo_code/:promo_code_id', adminController.delete_promo_code)


             /* forget password */

// Api for generate otp
          router.post("/generate_otp", adminController.generate_otp)
// Api for verifyOTP
           router.post("/verify_admin_OTP", adminController.verify_admin_OTP)
// Api for adminResetPass
           router.post("/adminResetPass/:adminId", adminController.adminResetPass )




               

 

module.exports = router