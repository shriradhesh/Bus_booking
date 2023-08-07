const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')

                    /*   --> USER API <--   */ 

// user Register 

router.post('/register', userController.userRegister )

// user login by id

router.post('/login', userController.loginUser)

// user change password

router.post('/userChangePass', userController.userChangePass)

module.exports = router