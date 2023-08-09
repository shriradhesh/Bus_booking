const UserModel = require('../models/userModel');
const tokenModel = require("../models/tokenModel")
const sendEmail =require("../utils/sendEmail")
const bcrypt = require('bcrypt')
const changePass = require('../models/changePassword')
const cors = require('cors')
const nodemailer = require('nodemailer')
const crypto = require('crypto');
const { error, log } = require('console');
const upload = require('../uploadImage')
                        
                                    /* --> User API <-- */


// API for user Register 

            const userRegister =  async (req,res)=>{
               try{
               const { fullName, email , password , phone_no , age , gender} = req.body;

                  if(!fullName || !email || !password || !phone_no || !age || !gender){
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
                  password : hashedPassword,
                  phone_no: phone_no,
                  age: age,
                  gender: gender
               })
                     
                        // save Data into Database
               const data = await newUser.save()
               res.status(200).json({ message : ' User Created Successfully' , success : true, Data : data})
               }
               catch(error)
               {
                         console.error(error);
                        res.status(500).json({ error : 'Error while creating User' , success : false})
               }
            }


   // API for Login 
               
   const loginUser =async (req, res) => {
      try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email })
        if (!user) {
          return res.status(401).json({ error: 'Invalid email' , success : false });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid password' , success: false});
        }

            res.status(200).json({ message: 'Login Successfully', user: user , success : true });
        } catch (error) {
          console.error(error);
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
  

    // APi for Token generate and email send to user for  forget password  
       
              const forgetPassToken = async(req,res)=>{
               
                try{
                  const { email } = req.body;

                  if (!email || !isValidEmail(email)) {
                    return res.status(400).send("Valid email is required");
                   }

                   const user = await UserModel.findOne({ email })

                   if(!user)
                   {
                    return res.status(404).json({ success: false, message : ' User with given email not found'})
                   }
                     
                       let token = await tokenModel.findOne({ userId : user._id })
                       if(!token){
                        token = await new tokenModel ({
                          userId : user._id,
                          token : crypto.randomBytes(32).toString("hex")
                        }).save()
                       }

                       const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`
                       await sendEmail(user.email, "Password reset", link)

                       res.status(200).json({success : true ,messsage  : "password reset link sent to your email account"})
                      
              }
              catch(error)
              {

                res.status(500).json({success : false , message : "An error occured" , error : error})
              }
              function isValidEmail(email) {
                // email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            }
            }

  // APi for Token verify and reset password for forget password 
                
          const userResetPass =async(req,res) =>{
            try{
                  const {password} = req.body;
                  const userId = req.params.userId;
                  const tokenValue = req.params.token
              
                     
                  if(!password)
                  {
                    return res.status(400).json({ success : false , error : 'Password is required '})
                  }

                  const user = await UserModel.findById(userId)
                  if(!user){
                    return res.status(400).json({success : false,  error : 'Invalid Link or expired '})
                  }

                      const userToken = await tokenModel.findOne({
                        userId : user._id,
                        token : tokenValue
                      })

                      if(!userToken){
                        return res.status(400).json({ success : false , error : 'Invalid link or expire'})
                      }
                            const hashedPassword = await bcrypt.hash(password,10)
                            user.password = hashedPassword
                            await user.save()
                            await userToken.deleteOne({
                              userId : user._id,
                              token : tokenValue
                            })
                            res.status(200).json({success : true ,  message : " password reset successfully"})
                        }   
                        
                        catch(error)
                        {
                           console.error("error " , error);
                          res.status(500).json({ success :false , error : ' an error occured '})
                        }
                            
                      }           
                                  
                                            /* --> User API for Manage Profile <-- */

    // update user profile
                        const updateUser = async(req,res)=>{
                          try{
                                  const id = req.params.id;
                                  const{ fullName , email ,phone_no, age, gender } = req.body
                                  const user = await UserModel.findById(id)

                                        // check for user exist
                              if(!user){
                                return res.status(404).json({ success : false , error : 'User not found'})
                              }
                                   user.fullName = fullName
                                   user.email = email

                                   // validate and update Phone number , age and gender 
                                   if (phone_no) {
                                    user.phone_no = phone_no;
                                    }
                                         
                                  if (age) {                                     
                                    const user_age = (Math.floor(age))                                        
                                  
                                    if (typeof user_age !== 'number' || user_age < 0 && age > 150) {
                                        return res.status(400).json({ success: false, error: 'Invalid age' });
                                    }                                   
                                    user.age = age;
                                }   
                                if (gender) {
                                const lowerCaseGender = gender.toLowerCase();                       
                                    user.gender = lowerCaseGender
                                }
                               if(req.file)
                                  {
                                    user.profileImage = req.file.filename
                                  }
                                  
                                       
                              const updateUser = await user.save();                       
                              return res.status(200).json({ success: true, message: 'User profile updated successfully',user : updateUser });
                               
                          }
                          catch(error){
                            console.log(error);
                                res.status(500).json({ success : false , error : ' Error while updating user profile'})
                          }
                        }


module.exports = {userRegister , loginUser , userChangePass , forgetPassToken , userResetPass,
                    updateUser}