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
      },
        resetPasswordToken : String,
        resetPasswordExpire : Date,
    
    },
       {timestamps: true}
    )


    const Schema = mongoose.Schema;
   const tokenSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600,// this is the expiry time in seconds
    },
  })
  
const UserModel = mongoose.model('UserModel', userSchema);
const Token = mongoose.model('Token', tokenSchema)

module.exports = {UserModel , Token} ;

