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


  
                                                     /* Notification Management */


// API for get notification of particular user

const getNotification = async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Check for user
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Check for notifications
      const notifications = await NotificationDetail.find({
        userId,
        notification_status : 1
      });
  
      if (notifications.length === 0) {
        return res.status(400).json({
          success: false,
          message: "There are no notifications for the user yet",
        });
      }     
          const updatedNotifications = await notifications.sort(( a , b )=> b.createdAt - a.createdAt)

        return res.status(200).json({
          success: true,
          message: "User notifications",
          notification_details: updatedNotifications,
        });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };





  // API for notification status count
  const notificationCount = async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Check for user
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Check for notifications
      const notifications = await NotificationDetail.find({
        userId,
        notification_status : 1
      });      
  
  
      if (notifications.length === 0) {
        return res.status(400).json({
          success: false,
          message: "There are no notifications for the user yet",
        });
      } else {
        return res.status(200).json({
          success: true,
          SuccessMessage: "notification count",        
          unseenNotifications_Count: notifications.length,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        ServerErrorMessage: "server error",
      });
    }
  };

  // Api for seen user notification 
      const seenUserNotification = async ( req , res )=> {
         try {
                 const notification_id = req.params.notification_id
                // check for notification Id

                if(!notification_id)
                {
                  return res.status(400).json({
                     success : false,
                     message : 'notification Id required'
                  })
                }

                //check for notification required

              const check_notify = await NotificationDetail.findOne({
                 _id : notification_id
              })

              if(!check_notify)
              {
                return res.status(400).json({
                   success : false ,
                   message : 'no notification found'
                })
              }

                 check_notify.notification_status = 0
                 await check_notify.save()

                 return res.status(200).json({
                   success : true ,
                   message : 'notification seen ..!'
                 })
         } catch (error) {
             return res.status(500).json({
               success : false ,
               message : 'server error',
               error_message : error.message
             })
         }
      }

  
  // Api for get notification of admin
  const getAdminNotification = async (req, res) => {
    try {
      const adminId = req.params.adminId;
      // check for admin
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Admin not found",
        });
      }
  
      // check for notification
      const notification = await AdminNotificationDetail.find({});
      if (notification.length === 0) {
        return res.status(400).json({
          success: false,
          message: "there is no notification for Admin",
        });
      } else {
        const notifications = notification.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        return res.status(200).json({
          success: true,
          message: "Admin Notification",
          admin_notification: notifications,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "server error",
      });
    }
  };
  
  // APi for send Notification to all user about trip
  
  const sendNotification_to_tripUsers = async (req, res) => {
    try {
      const { title, message, tripId } = req.body;
  
      const requiredFields = ["title", "message"];
  
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            message: `Missing ${field.replace("_", " ")} field`,
            success: false,
          });
        }
      }
      if (!tripId) {
        return res.status(400).json({
          success: false,
          tripValidationMessage: "select trip for send notification",
        });
      }
  
      // Check for the trip
      const trip = await BookingModel.findOne({ tripId });
  
      if (!trip) {
        return res.status(400).json({
          success: false,
          message: "Trip not found",
        });
      }
  
      // Save the notification in the database
      const notification = {
        tripId,
        date: trip.date,
        title,
        message,
      };
  
      const savedNotification = await UsersNotificationModel.create(notification);
  
      // Send email notification to all users
      const userTripIds = await BookingModel.find({ tripId }).distinct("userId");
  
      for (const userId of userTripIds) {
        const user = await UserModel.findById(userId);
  
        if (user) {
          let messageContent = `
                                          Dear ${user.fullName}, 
                                          *************************************************************** 
                                          ${title} 
                                          ---------
                                          ${message}
                                          *****************************************************************
                                        `;
  
          // Send email notification to the user
          await sendTripNotificationEmails(
            user.email,
            "Trip Notification",
            messageContent
          );
        }
      }
  
      return res.status(200).json({
        success: true,
        message: "Notification sent to user emails",
        notification_details: savedNotification,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  
  
  // API for sendNotification_to_all user
  const sendNotification_to_allUser = async (req, res) => {
    try {
      const { title, message } = req.body;
  
      const requiredFields = ["title", "message"];
  
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing ${field.replace("_", " ")} field `,
          });
        }
      }
  
      // Get all users
      const users = await UserModel.find({});
  
      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: "There is no user in UserModel",
        });
      }
  
      // Send the same notification email to all users
      const notifications = await Promise.all(
        users.map(async (user) => {
          // Prepare email content
          let messageContent = `
                                                Dear ${user.fullName}, 
                                                *************************************************************** 
                                                ${title} 
                                                ---------
                                                ${message}
                                                ****************************************************************
                                              `;
  
          // Send email notification to the user
          await sendTripNotificationEmails(
            user.email,
            "Notification",
            messageContent
          );
  
          // Add user-specific data to the notifications array
          return {
            userId: user._id,
            title,
            message,
            userEmail: user.email,
          };
        })
      );
  
      // Save a single record in UsersNotificationModel
      const savedNotification = await UsersNotificationModel.create({
        title,
        message,
        date: new Date(),
      });
  
      return res.status(200).json({
        success: true,
        message: "Notifications sent to user email",
        notification_details: savedNotification,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  // API for send notification to users about trips
  const sendNotifications = async (req, res) => {
    try {
      const adminChoice = req.body.adminChoice;
  
      let notificationFunction;
  
      if (adminChoice === 1) {
        notificationFunction = sendNotification_to_tripUsers;
      } else if (adminChoice === 2) {
        notificationFunction = sendNotification_to_allUser;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid admin choice. Please provide valid choice (1 or 2).",
        });
      }
  
      // Call the selected notification function
      await notificationFunction(req, res);
  
      // Only send the success response if the notification function didn't send a response
      if (!res.headersSent) {
        return res.status(200).json({
          success: true,
          message: "Notification sent",
        });
      }
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    }
  };
  
  // API for get all notification details
  const getAll_Users_Notificatation = async (req, res) => {
    try {
      const { title, tripId } = req.query;
      const filter = {};
  
      if (title) {
        filter.title = title;
      }
  
      if (tripId) {
        filter.tripId = tripId;
      }
  
      const notifications = await UsersNotificationModel.find(filter);
  
      if (notifications.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No notifications for the user",
        });
      }
  
      const allNotifications = notifications.map((notification) => ({
        ...notification.toObject(),
        send_to: notification.tripId ? "tripUser" : "allUser",
      }));
  
      const response = {
        success: true,
        message: "User Notifications",
        notifications: allNotifications,
      };
  
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  // APi to delete ALL USER notification
  
  const deleteAllUserNotifications = async (req, res) => {
    try {
      // Delete all records in the UsersNotificationModel
      await UsersNotificationModel.deleteMany({});
  
      return res.status(200).json({
        success: true,
        message: "All notifications deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  // API for delete notification by Id
  const deleteNotifcationById = async (req, res) => {
    try {
      const notificationId = req.params.notificationId;
      // check for notification
  
      const notification = await UsersNotificationModel.findByIdAndDelete({
        _id: notificationId,
      });
      if (!notification) {
        return res.status(400).json({
          success: false,
          message: "no notifcation found with the given Id",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "notification deleted successfully",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "server error",
      });
    }
  };
                                                                  /* Other services */
  
  
  // // API for delete particular feedback by id
  const deleteFeedback = async (req, res) => {
    try {
      const feedbackId = req.params.feedbackId;
      // check for feedback existance
      const feedback = await contactModel.findOneAndDelete({
        _id: feedbackId,
      });
      if (!feedback) {
        return res.status(400).json({
          success: false,
          feedbackExistanceMessage: "no feedback exist for the given feedback Id",
        });
      } else {
        return res.status(200).json({
          success: true,
          SuccessMessage: "Feedback deleted successfully",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        ServerErrorMessage: "server Error",
      });
    }
  };



  module.exports = {
    getNotification,
    getAdminNotification,
 
   sendNotification_to_tripUsers,
  sendNotification_to_allUser,
  sendNotifications,
  getAll_Users_Notificatation,
  deleteAllUserNotifications,
  deleteNotifcationById,
  deleteFeedback,
  notificationCount,
  seenUserNotification
 
  
  }