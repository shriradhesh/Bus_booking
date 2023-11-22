const UserModel = require('../models/userModel');
const tokenModel = require("../models/tokenModel")
const BusRoute = require('../models/bus_routes')
const BusModel = require('../models/busModel')
const  BookingModel = require('../models/BookingModel')
const contactModel = require('../models/contactUs')
const sendEmails = require('../utils/sendEmails')
const bcrypt = require('bcrypt')
const session = require('express-session')
const changePass = require('../models/changePassword')
const cors = require('cors')
const nodemailer = require('nodemailer')
const qrcode = require('qrcode')
const crypto = require('crypto');
const { error, log } = require('console');
const upload = require('../uploadImage')
const shortid = require('shortid')
const cron = require('node-cron');
const { TokenExpiredError } = require('jsonwebtoken');
const mongoose = require('mongoose')
const fs = require('fs')
const sendUserRegisterEmail = require('../utils/userRegisterEmail')
                        
                                    /* --> User API <-- */


// API for user Register 

            const userRegister = async (req, res) => {
              try {
                  const { fullName, email, password, phone_no, age, gender } = req.body;
          
                  if (!fullName || !email || !password || !phone_no || !age || !gender) {
                      return res.status(400).json({ error: 'Missing required Field ', success: false });
                  }
          
                  // Check for existing user
                  const existUser = await UserModel.findOne({ email });
                  if (existUser) {
                      return res.status(400).json({ message: 'Email Already Exists', success: false });
                  }
          
                  // Validate email
                  if (!isValidEmail(email)) {
                      return res.status(400).json({
                          success: false,
                          message: 'Valid email is required',
                      });
                  }
          
                  // Hash password
                  const hashedPassword = await bcrypt.hash(password, 10);
          
                  // Create new user
                  const newUser = new UserModel({
                      fullName: fullName,
                      email: email,
                      password: hashedPassword,
                      phone_no: phone_no,
                      age: age,
                      gender: gender,
                      isNew: true, 
                  });
          
                  // Save data into the database
                  const data = await newUser.save();
          
                  // Send registration email
                  const link = `\nClick the link or button below to login. \n ${process.env.User_loginUrl}`;
                  await sendUserRegisterEmail(newUser.email, `Congratulations! User created successfully.`, link);
          
                  res.status(200).json({ message: `user created successfully , \n successfull email send to registered email`, success: true, Data: data });
              } catch (error) {
                  console.error(error);
                  res.status(500).json({ message: 'Error while creating User', success: false });
              }
          
              function isValidEmail(email) {
                  // Email validation
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  return emailRegex.test(email);
              }
          };
          


   // API for Login 
               
   const loginUser =async (req, res) => {
      try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email })
        if (!user) {
          return res.status(401).json({ message : 'Invalid email' , success : false });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message : 'Invalid password' , success: false});
        }

            res.status(200).json({ message: 'Login Successfully', user: user , success : true });
        } catch (error) {
          console.error(error);
            res.status(500).json({ message : 'Error while login the user' , success: false });
        }
    }

  // Api for logout user
        const logoutUser = async(req,res)=>{
          try{
            req.session.destroy(error =>{
              if(error)
              {
                return res.status(500).json({ success : false ,  message :" Error while Logout the user"})
              }
              res.status(200).json({  success: true , message: ' user Logged out successfully' });
            });
          }
          catch(error)
          {
            res.status(500).json({ message : 'Error while logging out', success: false });
          }
          
        }

   // API for change user password
  const userChangePass = async (req,res)=>{
   
      try{
          const { email , oldPassword , newPassword , confirmPassword} = req.body                
            

          // check for password match                     
            
            if( newPassword !== confirmPassword )
            {
              return res.status(400).json({ message : 'Password do not match' , success : false})
            }

             // find Admin by Id
             
             const user = await UserModel.findOne({ email })
              
             if(!user){
       
              return res.status(404).json({ message : ' user not found' , success : false})
             }
             else
             {
                                     
               // check if old password match with stored password
               
               const isOldPasswordValid = await bcrypt.compare(oldPassword , user.password)
                  if(!isOldPasswordValid)
                  {
                      return res.status(400).json({ message : 'Old Password incorrect ', success : false})
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
                    return res.status(400).json({
                                  success : false,
                                  message : "Valid email is required"
                    })
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

                       const link = `${process.env.BASE_URL} \n\n 
                                        token = ${token}`
                       await sendEmails(user.email, "Password reset" , link )

                       res.status(200).json({success : true ,messsage  : "password reset link sent to your email account" , token : token})
                      
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
                                      const updateUser = async (req, res) => {
                                        try {
                                            const id = req.params.id;
                                            if (!mongoose.Types.ObjectId.isValid(id)) {
                                              return res.status(400).json({ success: false, message: 'Invalid user ID' });
                                            }
                                            const { fullName, phone_no, age, gender } = req.body;
                                            const user = await UserModel.findOne({ _id:id });
                                    
                                            // Check for user existence
                                            if (!user) {
                                                return res.status(404).json({ success: false, message: 'User not found' });
                                            }
                                    
                                            user.fullName = fullName;
                                    
                                            // Validate and update Phone number, age, and gender
                                            if (phone_no) {
                                                user.phone_no = phone_no;
                                            }
                                    
                                            if (age !== undefined) {
                                                const user_age = Math.floor(age);
                                    
                                                if (typeof user_age !== 'number' || user_age < 0 || user_age > 150) {
                                                    return res.status(400).json({ success: false, message: 'Invalid age' });
                                                }
                                                user.age = user_age;
                                            }
                                    
                                            if (gender) {
                                                const lowerCaseGender = gender.toLowerCase();
                                                user.gender = lowerCaseGender;
                                            }
                                    
                                            if (req.file) {
                                                if (user.profileImage) {
                                                    // If the user already has a profileImage, delete the old file if it exists
                                                    const oldFilePath = `path_to_profile_images/${user.profileImage}`;
                                                    if (fs.existsSync(oldFilePath)) {
                                                        fs.unlink(oldFilePath, (err) => {
                                                            if (err) {
                                                                console.error('Error deleting old file:', err);
                                                            }
                                                        });
                                                    }
                                                    // Update the profileImage with the new one
                                                    user.profileImage = req.file.filename;
                                                } else {
                                                    // If it doesn't exist, simply set it to the new file
                                                    user.profileImage = req.file.filename;
                                                }
                                            }
                                    
                                            const updateUser = await user.save();
                                            return res.status(200).json({ success: true, message: 'User profile updated successfully', user: updateUser });
                                        } catch (error) {
                                            console.log(error);
                                            res.status(500).json({ success: false, message: 'Error while updating user profile' });
                                        }
                                    };
                                    
                                          

            // APi for get user by email 

                        const getUser = async (req, res) => {
                          try {
                            const email = req.params.email;
                            const user = await UserModel.findOne({ email });
                
                            if (!user) {
                              return res.status(404).json({ success : false , message : 'User not found' });
                            }
                
                            res.status(200).json({ success : true , message : ' user details ' , user_Details : user });
                          } catch (err) {
                            res.status(500).json({ success : false , message : 'Error while finding the user' });
                          }
                        }

// API for delete User
                          const deleteUser =  async (req, res) => {
                            try {
                              const userId = req.params.userId;

                              // Check if the user exists
                              const user = await UserModel.findById(userId);
                              if (!user) {
                                return res.status(404).json({ message: 'User not found', success: false });
                              }

                              // Delete the user
                              await UserModel.findByIdAndRemove(userId);

                              res.status(200).json({ message: 'User deleted successfully', success: true });
                            } catch (error) {
                              console.error(error);
                              res.status(500).json({ message: 'Error while deleting user', success: false });
                            }
                          }

                                               /*  See Routes */
//Api for see Routes
                  const seeRoutes = async (req, res) => {
                    try {

                    const status = req.query.status;

                    let Routes;
                    if (status === 'active' || status === 'inactive') {
                        Routes = await BusRoute.find({ status: status });
                    } else {
                        Routes = await BusRoute.find({});
                    }

                    res.status(200).json({success: true , message: 'All Routes', Route_Detail : Routes });
                    } catch (error) {
                    res.status(500).json({success : false, message: 'There is an error to find Routes' + error.message});
                    }
                  }

                                                       /* My Bookings */
    
   //Api for check upcoming bookings
            
                        const upcoming_Booking = async (req,res)=>{

                            try{
                                const  userId  = req.params.userId                                          
                                const today = new Date()                                         
                                const user = await UserModel.findOne({_id:userId})  
                                if (!user) {
                                  return res.status(400).json({ success: false, message: 'User not found' });
                                    }
                                                    
                              const upcomingBookings = await BookingModel.find({    
                                userId: userId,                                    
                                "date":{
                                  $gte: today,
                                },
                                "status": "confirmed" 
                              }).sort({date : 1})                                       
                                res.status(200).json({ success : true , bookings : upcomingBookings})  
                              }

                            catch(error)
                            {
                              console.error(error);
                                return res.status(500).json({ success : false , message : ' error occured to find upcoming booking'})
                            }
                        }

            
        //Api for check  Bookings History
            
        const bookingHistory = async (req, res) => {
          try {
            const userId = req.params.userId;
            const user = await UserModel.findOne({ _id: userId });
        
            if (!user) {
              return res.status(400).json({ success: false, error: 'User not found' });
            }
        
            const today = new Date();
        
            const bookingHistory = await BookingModel.find({
              userId: userId, 
              date: {
                $lte: today,
              },
            }).sort({ date: 1 });
        
            res.status(200).json({ success: true, bookings: bookingHistory });
          } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error occurred while finding booking history' });
          }
        }

    // contact us 
    const contactUs =  async (req,res)=>{
      try{
      const { fullName, email , companyName , message} = req.body;

         if(!fullName || !email || !companyName || !message ){
         return res.status(400).json({ error : 'Missing required Field ', success : false})
         }              
     
      var newMessage = new contactModel({
        fullName : fullName,
         email : email,
         companyName : companyName,
         message: message,
         
      })
            
               // save Data into Database
      const data = await newMessage.save()
      res.status(200).json({ message : ' message Created Successfully' , success : true, Data : data})
      }
      catch(error)
      {
                console.error(error);
               res.status(500).json({ message : 'Error while creating message' , success : false})
      }
   }         
        
// get all feedbacks detials
                   const allFeedback = async (req , res)=>{
                    try {
                           const feedbacks = await contactModel.find({})

                           res.status(200).json({
                                        success : true ,
                                        message : 'all feedbacks',
                                        feedbacks : feedbacks
                           })
                            
                    } catch (error) {
                      return res.status(500).json({
                                        success : false,
                                        message : 'there is an server error'
                      })
                    }
                   }

          
module.exports = {userRegister , loginUser , logoutUser , userChangePass , forgetPassToken , userResetPass,
                    updateUser , getUser , deleteUser, seeRoutes , upcoming_Booking , bookingHistory , contactUs ,
                    allFeedback
                  }