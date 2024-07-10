const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admin = require("../models/adminModel");
const changePass = require("../models/changePassword");
const BookingModel = require("../models/BookingModel");
const UserModel = require("../models/userModel");
const BusModel = require("../models/busModel");
const stopModel = require("../models/stopModel");
const sendCancelEmail = require("../utils/sendCancelEmail");
const sendBookingEmail = require("../utils/sendBookingEmail");
const sendTripNotificationEmails = require("../utils/sendtripNotificationEmail");
const CancelTripEmail = require("../utils/CancelTripEmail");
const NotificationDetail = require("../models/notificationDetails");
const TransactionModel = require("../models/transactionModel");
const userController = require("./userController");
const upload = require("../uploadImage");
const BusRoute = require("../models/bus_routes");
const DriverModel = require("../models/driverModel");
const passport = require("passport");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const shortid = require("shortid");
const qrcode = require("qrcode");
const { error, log } = require("console");
const fs = require("fs");
const moment = require("moment");
const twilio = require("twilio");
const TripModel = require("../models/tripModel");
const cron = require("node-cron");
const axios = require("axios");
const ExcelJs = require("exceljs");
const _ = require("lodash");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { validationResult } = require("express-validator");
const AdminNotificationDetail = require("../models/AdminNotification");
const UsersNotificationModel = require("../models/UsersNotificationModel");
const contactModel = require("../models/contactUs");
const { response } = require("express");
const { useUserProvisioning, useCollections } = require("mtn-momo");
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require('pdfkit')
const promo_Code_Model = require('../models/promo_code')
const promoCodeEmail = require('../utils/promoCode_email')
const adminotpModel = require("../models/adminOtp")
const sendEmails = require('../utils/sendEmails')





/* -->  ADMIN Api'S   <--    */

//admin login API                           // UserName : Admin , Password : A1bcd2@12

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({
        success: false,
        userNameMessage: "username Required",
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        passwordMessage: "password Required",
      });
    }
    // Find Admin by email
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res
        .status(401)
        .json({ userNameMessage: "username incorrect", success: false });
    }

    // Check if the stored password is in plain text
    if (admin.password && admin.password.startsWith("$2b$")) {
      // Password is already bcrypt hashed
      const passwordMatch = await bcrypt.compare(password, admin.password);

      if (!passwordMatch) {
        return res
          .status(401)
          .json({ passwordMessage: "Password incorrect", success: false });
      }
    } else {
      // Convert plain text password to bcrypt hash
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update the stored password in the database
      admin.password = hashedPassword;
      await admin.save();
    }

    return res.json({
      message: "Admin Login Successful",
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// API for google login
const googleLogin = async (req, res) => {
  try {
    const { email } = req.body;

    // Find Admin by email
    const admin = await Admin.findOne({ email });

    if (admin) {
      return res.json({
        message: "Admin Login Successful",
        success: true,
        data: admin,
      });
    } else {
      return res
        .status(401)
        .json({ message: "Email not found", success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// APi for change  Login password

const changePassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const requiredFields = ["oldPassword", "newPassword", "confirmPassword"];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({
            message: `Missing ${field.replace("_", " ")} field`,
            success: false,
          });
      }
    }

    // check for password match

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({
          passNotMatchedMessage: "Password do not match",
          success: false,
        });
    }

    // find Admin by Id

    const admin = await Admin.findOne({ _id: id });

    if (!admin) {
      return res
        .status(404)
        .json({ NotAdminMessage: " Admin not found", success: false });
    } else {
      // check if old password match with stored password

      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        admin.password
      );
      if (!isOldPasswordValid) {
        return res
          .status(400)
          .json({
            OldPassIncorrectMessage: "Old Password incorrect ",
            success: false,
          });
      }

      // encrypt the newPassword

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      // update the admin password with new encrypted password
      admin.password = hashedNewPassword;
      await admin.save();
      return res.json({
        SuccessMessage: " Password changed Successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error ", success: false });
  }
};

// APi for get Admin Details
const getAdminDetails = async (req, res) => {
  try {
    // check for admin
    const admin = await Admin.find({});
    if (!admin) {
      return res.status(400).json({
        success: false,
        adminExistanceMessage: "admin not found",
      });
    } else {
      return res.status(200).json({
        success: true,
        SuccessMessage: "admin details",
        Admin_details: admin,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      ServerErrorMessage: "server error",
    });
  }
};               
                  
// ApI for change Porfile
const changeProfile = async (req, res) => {
  try {
    const AdminId = req.params.AdminId;

    if (!AdminId) {
      return res.status(400).json({
        success: false,
        adminExistanceMessage: "AdminId required",
      });
    }
    // check for Admin exist
    const admin = await Admin.findById(AdminId);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    if (req.file) {
      admin.profileImage = req.file.filename;
    }
    const newNotification = new AdminNotificationDetail({
      adminId: AdminId,
      message: `your profile has been updated successfully `,
      date: new Date(),
    });
    await newNotification.save();

    await admin.save();
    return res
      .status(200)
      .json({ success: true, message: "Admin profile change successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: " Error while changing Admin profile" });
  }
};
// APi for update Admin profile
const updateAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const { username, email } = req.body;

    const requiredFields = ["username", "email"];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({
            message: `Missing ${field.replace("_", " ")} field`,
            success: false,
          });
      }
    }

    // Check for admin existence
    let admin = await Admin.findOne({ _id: id });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Update username and email
    admin.username = username;
    admin.email = email;
           
    if (req.file && req.file.filename) {
      // Get the file extension
      const fileExtension = path.extname(req.file.filename).toLowerCase();

      // List of allowed extensions
      const allowedExtensions = ['.jpg', '.jpeg', '.png'];

      // Check if the file extension is in the allowed list
      if (allowedExtensions.includes(fileExtension)) {
          // If valid, update the profile image
          admin.profileImage = req.file.filename;
      } else {
          // If not valid, throw an error
          return res.status(400).json({
              success : false ,
              message :  'Invalid file type. Only .jpg, .jpeg, and .png files are allowed.'
      });
      }
  }

    // Save the updated admin object in the database
    await admin.save();

    return res
      .status(200)
      .json({ success: true, message: "Admin profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
                                                        
                                                   
                                                      /*  Promo code  */

     // Api for create Promo code 
     const create_promo_code = async (req, res) => {
      try {
         
          const { offer_title, offer_description, promo_code, discount, limit , start_Date, end_Date } = req.body;
  
          
          // Check for required fields
          const requiredFields = { offer_title, offer_description, promo_code, discount, start_Date, end_Date ,limit };
          for (const [field, value] of Object.entries(requiredFields)) {
              if (!value) {
                  return res.status(400).json({
                      success: false,
                      message: `Missing ${field.replace('_', ' ')} field`
                  });
              }
          }
  
          // Check for existing promo code
          const exist_promo_code = await promo_Code_Model.findOne({
              promo_code: promo_code,
              start_Date: { $lte: new Date(new Date(end_Date).getTime() + 24 * 60 * 60 * 1000) },
              end_Date: { $gte: new Date(start_Date) }
          });
  
          if (exist_promo_code) {
              return res.status(400).json({
                  success: false,
                  message: `Promo code : ${promo_code} , already exists within the same duration of start date & end date`
              });
          }         
                         

          // Create new promo code
          const new_promo = new promo_Code_Model({
              offer_title,
              offer_description,
              promo_code,
              discount,
              start_Date,
              end_Date,
              limit
          });
  
          await new_promo.save();



          const all_user = await UserModel.find({ })

          const formatDate = (dateString) => {
            return new Date(dateString).toISOString().slice(0, 10);
        };
        
        const formattedStartDate = formatDate(start_Date);
        const formattedEndDate = formatDate(end_Date);
        

         const emailContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                  <div style="background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0;">New Promotional Offer!</h1>
                  </div>
                  <div style="padding: 20px; text-align: left; color: #333333;">
                      <p>Hello,</p>
                      <p>We are excited to announce a new promotional offer!</p>
                      <div style="margin: 20px 0; padding: 10px; border-left: 4px solid #4CAF50; background-color: #f9f9f9;">
                          <p><strong>Offer Title:</strong> ${offer_title}</p>
                          <p><strong>Description:</strong> ${offer_description}</p>
                          <p><strong>Promo Code:</strong> ${promo_code}</p>
                          <p><strong>Discount:</strong> ${discount}%</p>
                          <p><strong>Valid From:</strong> ${formattedStartDate}</p>
                          <p><strong>To:</strong> ${formattedEndDate}</p>
                      </div>
                      <p>Hurry up and make the most of this offer!</p>
                  </div>
                  <div style="margin-top: 20px; text-align: left; font-size: 0.9em; color: #777777;">
                      <p> <h3> Best regards, </h3> <br>
                      <p> <h4> Camer Bus Travels </h4> </p>
                  </div>
              </div>
          </body>
          </html>
          `;
          
          
          
    for (const user of all_user) {
      promoCodeEmail ( user.email , 'New promoCode Available' , emailContent )
    }
          return res.status(200).json({
              success: true,
              message: 'New promo code created'
          });
  
      } catch (error) {
          return res.status(500).json({
              success: false,
              message: 'Server error',
              error_message: error.message
          });
      }
  };

// Api for get promo code
const get_promo_codes = async (req, res) => {
  try {
      const today = new Date();

      // Retrieve promo codes with a start date in the future or an end date in the future or today
      const upcomingPromos = await promo_Code_Model.find({
          $or: [
              { start_Date: { $gte: today } },
              { end_Date: { $gte: today } }
          ]
      }).sort({ start_Date: 1 });

      if (upcomingPromos.length === 0) {
          return res.status(400).json({
              success: false,
              message: 'No upcoming promo codes found'
          });
      }

      return res.status(200).json({
          success: true,
          message: 'Upcoming promo codes',
          promo_codes: upcomingPromos
      });
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};
  

  // Api for update particular promo code
  const update_promo_code = async (req, res) => {
    try {
        const promo_code_id = req.params.promo_code_id;
        const { offer_title, offer_description, discount, promo_code , limit} = req.body;

        // Check for promo code Id
        if (!promo_code_id) {
            return res.status(400).json({
                success: false,
                message: 'Promo code ID required'
            });
        }

        // Check for promo code existence
        const check_promo_code = await promo_Code_Model.findOne({ _id : promo_code_id });
        if (!check_promo_code) {
            return res.status(400).json({
                success: false,
                message: 'Promo code not found'
            });
        }

        // Check if promo code is expired
        const today = new Date();
        if (today > check_promo_code.end_Date) {
            return res.status(400).json({
                success: false,
                message: "Promo code is expired, you can't update it"
            });
        }

        // Update fields if provided
        check_promo_code.offer_title = offer_title;
        check_promo_code.offer_description = offer_description;
        check_promo_code.discount = discount;
        check_promo_code.promo_code = promo_code;
        check_promo_code.limit = limit;
        
        // Save the updated promo code
        await check_promo_code.save();

        return res.status(200).json({
            success: true,
            message: 'Promo code updated successfully',
            
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error_message: error.message
        });
    }
};

// Api for delete promo code

const delete_promo_code = async ( req , res )=>{
  try {
const promo_code_id = req.params.promo_code_id
  // check for promo code id
  if(!promo_code_id)
     {
         return res.status(400).json({
                success : false ,
                message : 'promo_code_id required'
         })
     }

 // check for promo code

 const check_promo_code = await promo_Code_Model.findOne({
        _id :  promo_code_id
 })

 if(!check_promo_code)
     {
         return res.status(400).json({
               success : false ,
               message : 'promo code not found'
         })
     }

     await check_promo_code.deleteOne()

 return res.status(200).json({
            success : true ,
            message : 'promo code deleted successfully'
 })
  } catch (error) {
     return res.status(500).json({
          success : false ,
          message : 'server error',
          error_message : error.message
     })
  }
}


                             /* Forget password  */
                             
            // APi for otp generate and email send to admin for  forget password  
       
    const generate_otp = async (req, res) => {
      try {
          const { email } = req.body;
  
          if (!email || !isValidEmail(email)) {
              return res.status(400).json({
                  success: false,
                  message: "Valid email is required"
              });
          }
  
          const admin = await Admin.findOne({ email });
  
          if (!admin) {
              return res.status(404).json({ success: false, message: 'Admin with given email not found' });
          }
  
          const otp = generateOTP();
  
          // Save the OTP in the otpModel
          const otpData = {
              adminId: admin._id,
              otp: otp
          };
          await adminotpModel.create(otpData);
  
          const emailContent = `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Forgot Password - Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
              <div class="container" style="width: 80%; margin: 20px auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
                  <section style="margin-top: 20px;">
                      <h2 style="color: #333; font-size: 24px; text-align: center; margin-bottom: 20px;">Dear ${admin.username} </h2>
                      <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 30px;">We received a request to reset your password. To proceed, please use the following One-Time Password (OTP):</p>
                      <div class="otp-box" style="background-color: #f3fcfd; text-align: center; padding: 20px; border-radius: 10px; margin: 0 auto 30px; max-width: 200px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
                          <div class="otp-code" style="font-size: 36px; font-weight: bold; color: #333;">${otp}</div>
                      </div>
                      <p class="message" style="color: #666; font-size: 14px; text-align: center; margin-bottom: 20px;">This OTP will expire in 2 minutes.</p>
                      <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 20px;">If you didn't request a password reset, you can ignore this email.</p>
                      <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 20px;">Thank you!</p>
                      <div class="footer" style="text-align: center; margin-top: 40px; color: #666; font-size: 14px;">&copy; Camer Bus Travels </div>
                  </section>
              </div>
          </body>
          </html>
          `
          await sendEmails(admin.email, "Password reset", emailContent);
  
          res.status(200).json({ success: true, 
                                   message: "An OTP has been sent to your email",
                                   email: admin.email , 
                                   
                                   });
      } catch (error) {
          console.error('error', error);
          res.status(500).json({ success: false, message: "An error occurred", error: error });
      }
  
      function isValidEmail(email) {
          // email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
      }
  
      function generateOTP() {
          const otp = Math.floor(1000 + Math.random() * 9000).toString();
          return otp.slice(0, 4);
      }
  };
  // APi for verify OTP
  const verify_admin_OTP = async (req, res) => {
            try {
                      const otp = req.body.otp                    

                     
                  // check for otp
                  if(!otp)
                  {
                    return res.status(400).json({
                       success : false ,
                       message : 'Otp required'
                    })
                  }

                  // check for otp existance

                  const adminOTP = await adminotpModel.findOne({ otp : otp })

                  if(!adminOTP)
                  {
                    return res.status(400).json({
                       success : false ,
                       message : 'invalid otp or expired'
                    })
                  }
                  else
                  {
                    return res.status(200).json({
                       success : true ,
                       message : "otp verified",
                       adminId : adminOTP.adminId
                    })
                  }
            } catch (error) {
                  return res.status(500).json({
                     success : false ,
                     message : 'server error',
                     error_message : error.message
                  })
              
            }
     }
    
  // APi for otp verify and reset password for forget password 
                
                  const adminResetPass = async (req, res) => {
                    try {
                        const { newPassword , confirmPassword  } = req.body;
                        const adminId = req.params.adminId
                        if (!newPassword) {
                            return res.status(400).json({ success: false, message: 'newPassword is required' });
                        }
                        if (!confirmPassword) {
                            return res.status(400).json({ success: false, message: 'confirmPassword is required' });
                        }
                        if (!adminId) {
                            return res.status(400).json({ success: false, message: 'adminId is required' });
                        }                       
                    
                        const admin = await Admin.findById(adminId);

                        if (!admin) {
                            return res.status(400).json({ success: false, message: 'Invalid adminId' });
                        }

                              // checlk if password and confirmpassword matched 
                  if(newPassword !== confirmPassword)
                    {
                        return res.status(400).json({
                                success : false ,
                                message : 'confirm password not matched'
                        })
                    }
                    const hashedPassword = await bcrypt.hash(newPassword, 10);
                    admin.password = hashedPassword;
                    await admin.save();
         
                        // Delete the used OTP
                        await adminotpModel.deleteOne({ adminId });

                        res.status(200).json({ success: true, message: 'Password reset successfully' });
                    } catch (error) {
                        console.error('error', error);
                        res.status(500).json({ success: false, message: 'An error occurred', error: error });
                    }
                };

 
module.exports = {
  adminLogin,
  googleLogin,
  changePassword,    
  changeProfile,
   getAdminDetails,
  updateAdmin,
  create_promo_code,
  get_promo_codes,
  update_promo_code,
  delete_promo_code,
  generate_otp,
  verify_admin_OTP,
  adminResetPass
 
  
 
};
