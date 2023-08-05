const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')

                    /*   --> USER API <--   */ 

// user Register 

router.post('/register', userController.userRegister )

// user login by id

router.get('/login', userController.loginUser)

module.exports = router