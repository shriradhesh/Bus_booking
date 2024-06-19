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




                                                                      /* Manage Transaction */
// Api for get All transaction
const All_Transaction = async (req, res) => {
    try {
      let startDate, endDate;
      let paymentStatus;
  
      // Check if startDate and endDate are present in the request query
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate);
        endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
      }
  
      // Check if the paymentStatus parameter is provided in the query
      if (req.query.payment_status) {
        paymentStatus = req.query.payment_status.toLowerCase(); // Ensure consistent comparison
      }
  
      const query = {};
  
      // Add conditions to the query based on provided parameters
      if (startDate && endDate) {
        query.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }
  
      if (paymentStatus) {
        if (paymentStatus === "success") {
          // If payment_status is 'success', include all 'SUCCESSFUL', 'SUCCESSFULL', and 'succeeded' payment statuses
          query.payment_status = { $in: ["SUCCESSFUL", "succeeded", "SUCCESSFULL"] };
        } else if (paymentStatus === "refund") {
          // If payment_status is 'success', include all 'SUCCESSFUL', 'SUCCESSFULL', and 'succeeded' payment statuses
          query.payment_status = { $in: ["cancel" ] };
        } 
         else if (paymentStatus === "failed") { // Ensure consistent comparison
          // If payment_status is 'failed', include all Failed payment statuses
          query.payment_status = { $in: ["Failed" , 'failed'] };
        } else if (paymentStatus === "pending") { // Ensure consistent comparison
          // If payment_status is 'PENDING', include all PENDING payment statuses
          query.payment_status = { $in: ["PENDING"] };
        }
        else {
          // If payment_status is provided but not 'success' or 'failed', 'pending' use the provided value directly
          query.payment_status = paymentStatus;
        }
      }
           
      const transactions = await TransactionModel.find(query);
      const transactionLength = transactions.length;
  
               // sorted transaction
          const sortedTransaction = transactions.sort(( a , b )=> b.createdAt - a.createdAt)
  
      // Respond with the fetched transactions
      res.status(200).json({
        success: true,
        message: "All Transactions",
        sortedTransaction,
        transactionLength,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Handle errors gracefully
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  // APi for get total amount in transaction table
  const totalTransactionAmount = async (req, res) => {
    try {
      // Aggregate to calculate the total amount directly in the database
      const result = await TransactionModel.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);
  
      const totalAmount = result.length > 0 ? result[0].totalAmount : 0;
  
      return res.status(200).json({
        success: true,
        SuccessMessage: "Total amount calculated successfully",
        totalAmount: totalAmount
      });
    } catch (error) {
      console.error("Error calculating total transaction amount:", error);
      return res.status(500).json({
        success: false,
        ServerErrorMessage: "Server error while calculating total amount"
      });
    }
  };
  
  // APi for get particular transaction from transaction model
  const getTransaction_by_bookingId = async (req, res) => {
    try {
      const bookingId = req.body.bookingId;
      // check for booking Id required
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          bookingIdRequired: "booking Id required",
        });
      }
  
      // check for transaction
      const transaction = await TransactionModel.find({ bookingId: bookingId });
      if (!transaction) {
        return res.status(400).json({
          success: false,
          transactionExistanceMessage: `transaction with the bookingId : ${bookingId} not exist`,
        });
      } else {
        return res.status(200).json({
          success: true,
          SuccessMessage: `transaction with the bookingId : ${bookingId} `,
          transaction_details: transaction,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        ServerErrorMessage: "server error",
      });
    }
  };
  
  
  // APi for get all Details count
  const getAllDetailsCount = async (req, res) => {
    try {
      // check for all Buses
      const allBuses = await BusModel.find({});
      if (!allBuses) {
        return res.status(400).json({
          success: false,
          BusExistanceMessage: "allBuses Not found",
        });
      }
      const BusLength = allBuses.length;
      // check for all Routes
      const All_Routes = await BusRoute.find({});
      if (!All_Routes) {
        return res.status(400).json({
          success: false,
          All_RoutesExistanceMessage: "Routes Not found",
        });
      }
      const All_RoutesLength = All_Routes.length;
  
      return res.status(200).json({
        success: true,
        details: {
          total_Bus: BusLength,
          total_Routes: All_RoutesLength,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        serverErrorMessage: "server error",
      });
    }
  };
  
  // APi for delete all Transaction
  
  const deleteAlltransaction = async (req, res) => {
    try {
      // Delete all records in the UsersNotificationModel
      await TransactionModel.deleteMany({});
  
      return res.status(200).json({
        success: true,
        message: "All transaction deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  

  
  module.exports = {
    All_Transaction,
 
    totalTransactionAmount,
    getTransaction_by_bookingId,
   
    getAllDetailsCount,
    deleteAlltransaction,
    
   
    
  }