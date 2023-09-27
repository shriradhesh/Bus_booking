const express = require('express');
const router = express.Router();
const passport = require('passport');
const socialController = require('../controller/socialController')

 // google login APi
              router.get('/google', socialController.googleLogin)
// Google callback route 
              router.get('/google/callback' , socialController.googleCallback)


// LinkedIn login route
router.get('/linkedin', socialController.linkedinLogin);

// LinkedIn callback route
router.get('/linkedin/callback', socialController.linkedinCallback);

// facebook login route
router.get('/facebook', socialController.facebookLogin);

// facebook callback route
router.get('/facebook/callback', socialController.facebookCallback);

// twitter login route
router.get('/twitter', socialController.twitterLogin);

// twitter callback route
router.get('/twitter/callback', socialController.twitterCallback);





module.exports = router;
