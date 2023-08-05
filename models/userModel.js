const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required : true,
      },  
      email: {
        type: String,
        required: true,
        unique : true
      },
      password: {
        type: String,
        required: true,
      }},
       {timestamps: true}
    )
const UserModel = mongoose.model('UserModel', userSchema);

module.exports = UserModel;

