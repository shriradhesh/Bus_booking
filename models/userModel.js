const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const bcryptSalt = process.env.BCRYPT_SALT
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
      },
      phone_no: {
        type: Number,
        required: true,
      },
      age: {
        type: Number,
        required: true,
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'other','Male','Female','Other'],
        required: true,
      },
      profileImage: {
        type: String,
        default: '',
      },
      user_status : 
      {
        type : Number,
        default : 0
      },
        resetPasswordToken : String,
        resetPasswordExpire : Date,
        
       
    
    },
       {timestamps: true}
    )



   
  
const UserModel = mongoose.model('UserModel', userSchema);


module.exports = UserModel  

