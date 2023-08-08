const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt')
const changePass = require('../models/changePassword')
const cors = require('cors')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
                         /* --> User API <-- */


// API for user Register 

            const userRegister =  async (req,res)=>{
               try{
               const { fullName, email , password } = req.body;

                  if(!fullName || !email || !password ){
                  return res.status(400).json({ error : 'Missing required Field ', success : false})
                  }
                              // check for email exist 
               const existUser = await UserModel.findOne({ email })
               if(existUser)
               {
                  return res.status(400).json({ error : ' Email Already Exist', success : false})
               }
                        // password hased
               const hashedPassword = await bcrypt.hash(password , 10)
               
               var newUser = new UserModel({
                  fullName : fullName,
                  email : email,
                  password : hashedPassword
               })
                     
                        // save Data into Database
               const data = await newUser.save()
               res.status(200).json({ message : ' User Created Successfully' , success : true, Data : data})
               }
               catch(error)
               {
                        res.status(500).json({ error : 'Error while creating User' , success : false})
               }
            }


   // API for Login 
               
   const loginUser =async (req, res) => {
      try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
          return res.status(401).json({ error: 'Invalid email' , success : false });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid password' , success: false});
        }

            res.status(200).json({ message: 'Login Successfully', user: user , success : true });
        } catch (error) {
            res.status(500).json({ error: 'Error while login the user' , success: false });
        }
    }

   // API for change user password
  const userChangePass = async (req,res)=>{
   
      try{
          const { email , oldPassword , newPassword , confirmPassword} = req.body                
            

          // check for password match                     
            
            if( newPassword !== confirmPassword )
            {
              return res.status(400).json({ error : 'Password do not match' , success : false})
            }

             // find Admin by Id
             
             const user = await UserModel.findOne({ email })
              
             if(!user){
       
              return res.status(404).json({ error : ' user not found' , success : false})
             }
             else
             {
                                     
               // check if old password match with stored password
               
               const isOldPasswordValid = await bcrypt.compare(oldPassword , user.password)
                  if(!isOldPasswordValid)
                  {
                      return res.status(400).json({ error : 'Old Password incorrect ', success : false})
                  }
            
                  // encrypt the newPassword 

                  const hashedNewPassword = await bcrypt.hash(newPassword ,10)
                  // update the admin password with new encrypted password 
                          user.password = hashedNewPassword
                          await user.save()
                          return res.json({ message : ' Password changed Successfully', success : true})
                      
              } 
          }
          
      catch(error)
      {
          console.error(error);
          res.status(500).json({ message : 'Internal server error ', success : false})
      }
  }
  

    // APi for forget password for user 
       
              const forgetPassword = async(req,res)=>{
               
                try{
                  const {email}= req.body
                   const user = await UserModel.findOne({ email })

                   if(!user)
                   {
                    return res.status(404).json({ success: false, message : ' User not found'})
                   }
                    // Generate a password reset token and expire time
                       const token = crypto.randomBytes(32).toString('hex')
                       const expireTime = Date.now() + 3600000
                   

                   // save reset token and expire time 

                   user.resetPasswordToken = token;
                   user.passwordResetTokenExpire = expireTime
                   await user.save();

                        // send password reset link to user email
                    
                       
                      
              }
              catch(error)
              {}
            }


module.exports = {userRegister , loginUser , userChangePass}