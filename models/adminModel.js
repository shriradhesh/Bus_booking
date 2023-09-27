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
})

  

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;

