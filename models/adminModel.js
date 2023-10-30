const mongoose = require('mongoose')
const adminSchema = mongoose.Schema({
    username : {
        type :String,
        required : true
    },
    password : {
        type : String,
        
    },
    profileImage: {
        type: String,
        default: '',
      },
      googleId : String,

      linkedinId : String,
      
      facebookId :{ 
        type: String,
         unique: true },

      twitterId :{ 
        type: String,
         unique: true },

         login_type :
         {
          type : String,
          enum: ['google', 'facebook' , 'twitter' , 'normal'],
          default: 'normal',
         },
})

  

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;

