const mongoose = require('mongoose')
const changePasswordSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
      }, 
      oldPassword :{
        type : String,
        required : true,
      },      
      newPassword: {
        type: String,
        required: true,
      },
      confirmPassword: {
        type: String,
        required : true
      },
})

const changePass = mongoose.model('changePass', changePasswordSchema);

module.exports = changePass;
