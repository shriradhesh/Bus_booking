const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy
const GoogleStrategy = require('passport-google-oauth2').Strategy
const TwitterStrategy = require('passport-twitter').Strategy;
const Admin = require('../models/adminModel'); 
require('dotenv').config();

// passport configuration for Google login
passport.use(
  new GoogleStrategy(
    {
      clientID: "828930927241-67n7cdg0eu56j1f0crpagpo06r3mrqok.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let existingAdmin = await Admin.findOne({
          googleId: profile.id,
        });

        if (existingAdmin) {
          return done(null, existingAdmin);
        }

        // If the admin does not exist, create a new admin in the database
        const newAdmin = new Admin({
          googleId: profile.id,
          username: profile.displayName,
          profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
        });

        await newAdmin.save();
        return done(null, newAdmin);
      } catch (error) {
        return done(error);
      }
    }
  )
);
// passport configuration for linkedIn login
passport.use(
  new LinkedInStrategy(
    {
      clientID : '78bmf8g0jwhnj4',
      clientSecret : 'Ni4dGLnkErHU2ddG',
      callbackURL: 'http://localhost:3000/auth/linkedin/callback',
     
    },
    async (accessToken, refreshToken, profile, done) => {
      
      try {
        let existingAdmin = await Admin.findOne({
          linkedinId: profile.id,
        });

        if (existingAdmin) {
          return done(null, existingAdmin);
        }
        else
        {

        // If the admin does not exist, create a new admin in the database
        const newAdmin = new Admin({
          linkedinId: profile.id,
          username: profile.displayName,
          profileImage:
                       profile.photos && profile.photos.length > 0
                      ? profile.photos[0].value
                          : '',
        });

        await newAdmin.save();
        return done(null, newAdmin);
      } 
    }
      catch (error) {
        console.error(error); 
        return done(error);
      }
    }
  )
);
// passport configuration for facebook login
passport.use(
  new FacebookStrategy({
    clientID :'302977945807103',
    clientSecret  : 'cd52c6c56378a9613d0d2033746bc9c4',
    callbackURL : 'http://localhost:4000/auth/facebook/callback'

  },
  async function(accessToken , refreshToken , profile , cb ){
    try{
    let existingAdmin = await Admin.findOne({
      facebookId : profile.id,
      provider : 'facebook',
    })
    if (existingAdmin) {
      return cb(null, existingAdmin);
    }
    else
    {        
        const newAdmin = new Admin({
          facebookId : profile.id,
          username : profile.displayName,
          provider : profile.provider ,
          profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
      
        })
        await newAdmin.save()
        return cb(null , newAdmin)
       }
      }
       catch(error)
       {
          return cb(error)
       }
      }
  )
)
const twitterConfig = {
  consumerKey: 'mmTqbKlap3HU0DZddm9F6D9wn',
  consumerSecret: 'o2XkZujeCymir1382obJA4rVSGtQG6BopGYBf3UUm7BYennXFt',
  callbackURL: 'http://localhost:4000/auth/twitter/callback',
};

// Configure Twitter Strategy
passport.use(
  new TwitterStrategy(twitterConfig, async (token, tokenSecret, profile, cb) => {
    try {
      let existingAdmin = await Admin.findOne({
        twitterId: profile.id,
        provider: 'twitter',
      });

      if (existingAdmin) {
        return cb(null, existingAdmin);
      } else {
        const newAdmin = new Admin({
          twitterId: profile.id,
          username: profile.displayName,
          provider: profile.provider,
          profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
        });

        await newAdmin.save();
        return cb(null, newAdmin);
      }
    } catch (error) {
      return cb(error);
    }
  })
);



module.exports = passport;
