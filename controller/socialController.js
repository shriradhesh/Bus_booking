const passport = require('passport');

// API for Google login
const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// API for Google callback
const googleCallback = passport.authenticate('google', {
  successRedirect: '/admin',
  failureRedirect: '/admin'
});

// LinkedIn login route
const linkedinLogin = passport.authenticate('linkedin', {
  scope: 'email'
});

// LinkedIn callback route
const linkedinCallback = passport.authenticate('linkedin', {
  successRedirect: '/admin',
  failureRedirect: '/login'
});

// Facebook login route
const facebookLogin = passport.authenticate('facebook', {
  scope: 'email'
});

// Facebook callback route
const facebookCallback = passport.authenticate('facebook', {
  successRedirect: '/admin',
  failureRedirect: '/login'
});

// twitter login route
const twitterLogin = passport.authenticate('twitter', {
  scope: 'email'
});

// Facebook callback route
const twitterCallback = passport.authenticate('twitter', {
  successRedirect: '/admin',
  failureRedirect: '/login'
});

module.exports = {
  googleLogin,
  googleCallback,
  linkedinLogin,
  linkedinCallback,
  facebookLogin,
  facebookCallback,
  twitterLogin,
  twitterCallback
};
