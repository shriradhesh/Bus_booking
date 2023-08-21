const UserModel = require('../models/userModel');
const tokenModel = require("../models/tokenModel")
const BusRoute = require('../models/bus_routes')
const BusModel = require('../models/busModel')
const  BookingModel = require('../models/BookingModel')
const sendEmail =require("../utils/sendEmail")
const sendEmails = require('../utils/sendEmails')
const bcrypt = require('bcrypt')
const changePass = require('../models/changePassword')
const cors = require('cors')
const nodemailer = require('nodemailer')
const qrcode = require('qrcode')
const crypto = require('crypto');
const { error, log } = require('console');
const upload = require('../uploadImage')
const shortid = require('shortid')
const cron = require('node-cron')
                        
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
                       await sendEmails(user.email, "Password reset", link)

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
                    res.status(500).json({success : false, error: 'There is an error to find Routes' + error.message});
                    }
                  }

                                   /* Bookings */
    // api for book tickit 
               
    
        const bookTicket = async (req, res) => {
          try {
                  const { userId, routeId, seatNumber, departureDate, status ,email , source , destination } = req.body;             
         
                  const requiredFields = ['userId', 'routeId', 'seatNumber', 'departureDate', 'email']; 
          
                  for (const field of requiredFields) {
                      if (!req.body[field]) {
                          return res.status(400).json({ error: `Missing ${field.replace('_', ' ')} field`, success: false });
                      }
                  }      
                        
                          const user = await UserModel.findOne({_id:userId})
                          const route = await BusRoute.findOne({_id:routeId})
                          if (!user) {
                            return res.status(400).json({ success: false, error: 'User not found' });
                             }
                
                          if (!route) {
                            return res.status(400).json({ success: false, error: 'Route not found' });
                            }

                            const userBookedSeatsCount = await BookingModel.countDocuments({ userId, departureDate });

                            if (userBookedSeatsCount >= 6) {
                                return res.status(400).json({ success: false, error: 'User has already booked the maximum allowed seats (6)' });
                            }
                          const isSeatBooked = await BookingModel.findOne({ routeId, seatNumber, departureDate });
                  
                          if (isSeatBooked) {
                              return res.status(400).json({ success: false, error: 'Seat already booked' });
                          }
                          const bookingId = shortid.generate();
                          const booking = new BookingModel({
                              userId,
                              routeId,
                              seatNumber,
                              departureDate,
                              status,
                              bookingId,
                          });
                  
                          await booking.save();
                          const bus = await BusModel.findOne(route.busId)
                          
                          if(!bus)
                          {
                            return res.status(400).json({success : false , error :'Bus not found'  })
                          }
                        
                          const sourceStopDetails = route.stops.find(stop => stop.stopName === source);
                        const destinationStopDetails = route.stops.find(stop => stop.stopName === destination);
          
                          const emailContent = `Dear ${user.fullName}, \n\n  \n\n Your booking  for departure on ${departureDate} has been confirmed.\n\n Journey Details:\n 
                              Booking ID: ${bookingId} 
                              Bus Number : ${bus.bus_no} \n
                              Bus Departure Time : ${route.starting_Date}\n
                              Source: ${sourceStopDetails.stopName}\n
                            Destination: ${destinationStopDetails.stopName}\n        
                              Seat Number : ${seatNumber}\n
                              Have a safe journey !
                              Thank you for choosing our service! `;

                                // Generate the QR CODE 

                                const qrCodeData = `http://192.168.1.25:3000/${bookingId}`;

                                    const qrCodeImage = 'tickit-QRCODE.png' 
                                    await qrcode.toFile(qrCodeImage , qrCodeData)  
                                    
                                                            
          
                              // Send booking confirmation email
                    
                                    await sendEmail(email , 'Your Booking has been confirmed' , emailContent); 
                                  res.status(200).json({ success: true, message: 'Booking successful Tickit  sent to user email' });
                            
                            } 
                          catch (error) 
                        {
                          console.error(error);
                            return res.status(500).json({success : false ,  error: "An error occured"});
                        }
                      }
              
              //Api for check upcoming bookings
            
                                  const upcoming_Booking = async (req,res)=>{

                                      try{
                                          const  userId  = req.params.userId                                          
                                          const today = new Date()                                         
                                          const user = await UserModel.findOne({_id:userId})  
                                          if (!user) {
                                            return res.status(400).json({ success: false, error: 'User not found' });
                                             }
                                                             
                                        const upcomingBookings = await BookingModel.find({                                        
                                          "departureDate":{
                                            $gte: today,
                                          }
                                        }).sort({departureDate : 1})                                       
                                         res.status(200).json({ success : true , bookings : upcomingBookings})  
                                        }

                                      catch(error)
                                      {
                                        console.error(error);
                                          return res.status(500).json({ success : false , error : ' error occured to find upcoming booking'})
                                      }
                                  }
                        

module.exports = {userRegister , loginUser , userChangePass , forgetPassToken , userResetPass,
                    updateUser , seeRoutes , bookTicket , upcoming_Booking }