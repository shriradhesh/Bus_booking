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



                                            /*   Driver Manage  */

//Api for add New Driver
const addDriver = async (req, res) => {
    try {
      const {
        driverId,
        driverName,
        driverContact,
        driverLicence_number,
        status,
        driverProfileImage,
      } = req.body;
  
      const requiredFields = [
        "driverId",
        "driverName",
        "driverContact",
        "driverLicence_number",
        "status",
      ];
  
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res
            .status(400)
            .json({
              missingFieldMessage: `Missing ${field.replace("_", " ")} field`,
              success: false,
            });
        }
      }
      // Check for driver existence
      const existingDriver = await DriverModel.findOne({ driverId });
      if (existingDriver) {
        return res
          .status(400)
          .json({ existDriverMessage: false, message: "driver already exist" });
      }
      // Check for valid driver status
      const validStatus = ["active", "inactive"];
      const driverStatus = validStatus.includes(status) ? status : "active";
  
      const newDriver = new DriverModel({
        driverId,
        driverName,
        driverContact,
        driverLicence_number,
        status: driverStatus,
      });
      // set Driver availability  and profile Images
      newDriver.availability = "available";
      if (req.file) {
        newDriver.driverProfileImage = req.file.filename;
      }
  
      const savedDriver = await newDriver.save();
      res
        .status(200)
        .json({
          success: true,
          SuccessMessage: " New Driver added successfully",
          driver: savedDriver,
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, ServerErrorMessage: "server error" });
    }
  };
  
  // Api for edit Driver Details
  const editDriver = async (req, res) => {
    try {
      const driverId = req.params.driverId;
      const { driverName, driverContact, status, availability } = req.body;
  
      // Check for valid status and availability values
      const validStatus = ["active", "inactive"];
      const validAvailability = ["available", "unavailable"];
  
      if (!validStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status value", success: false });
      }
  
      if (!validAvailability.includes(availability)) {
        return res
          .status(400)
          .json({ message: "Invalid availability value", success: false });
      }
  
      if (status === "inactive" && availability !== "unavailable") {
        return res
          .status(400)
          .json({
            message:
              "Driver status can only be set to inactive when availability is unavailable",
            success: false,
          });
      }
  
      if (availability === "unavailable" && status !== "inactive") {
        return res
          .status(400)
          .json({
            message:
              "Driver availability can only be set to unavailable when status is inactive",
            success: false,
          });
      }
  
      // Check for driver existence
      const existingDriver = await DriverModel.findOne({ _id: driverId });
  
      if (!existingDriver) {
        return res
          .status(404)
          .json({ success: false, message: "Driver not found" });
      }
  
      // Update the Driver properties
      existingDriver.driverName = driverName;
      existingDriver.driverContact = driverContact;
      existingDriver.status = status;
      existingDriver.availability = availability;
  
      // Update driver profile image if a file is provided
      if (req.file) {
        existingDriver.driverProfileImage = req.file.filename;
      }
  
      // Save the updated driver data into the database
      const updatedDriver = await existingDriver.save();
  
      res
        .status(200)
        .json({
          success: true,
          message: "Driver details updated successfully",
          Driver: updatedDriver,
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "server error" });
    }
  };
  
  // Api for Delete Driver
  const deleteDriver = async (req, res) => {
    try {
      const driverId = req.params.driverId;
      const driver = await DriverModel.findById(driverId);
  
      if (!driver) {
        return res
          .status(404)
          .json({ success: false, error: "driver not found" });
      }
      // Check if driver status is inactive and availability is unavailable
      if (driver.status === "inactive" && driver.availability === "unavailable") {
        await driver.deleteOne();
        res
          .status(200)
          .json({ success: true, message: "Driver deleted successfully" });
      } else {
        res
          .status(400)
          .json({
            success: false,
            message: "Driver booked with other bus and route ",
          });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error while deleting the Driver" });
    }
  };
  
  // Api for get all driver
  const allDrivers = async (req, res) => {
    try {
      const status = req.query.status;
  
      let Drivers;
      if (status === "active") {
        Drivers = await DriverModel.find({
          status: "active",
          availability: { $in: ["available", "booked", "unavailable"] },
        });
      } else if (status === "inactive") {
        Drivers = await DriverModel.find({
          status: "inactive",
          availability: "unavailable",
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status value" });
      }
                // sorted Driver
            const sortedDriver = Drivers.sort(( a , b )=> b.createdAt - a.createdAt )
      res
        .status(200)
        .json({ success: true, message: "All Drivers", Driver_Details: sortedDriver });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "There is an error to find Drivers" });
    }
  };
  
  // Api for Get a driver details by driver id
  const getDriver = async (req, res) => {
    try {
      const driverId = req.params.driverId;
      if (!driverId) {
        return res.status(400).json({
          success: false,
          driverIdExistance: "DriverId required",
        });
      }
  
      const driver = await DriverModel.findById(driverId);
  
      if (!driver) {
        return res
          .status(404)
          .json({ success: false, message: "Driver not found" });
      }
  
      res
        .status(200)
        .json({
          success: true,
          message: " driver found",
          Driver_Details: driver,
        });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "server Error",
                 error_message : err.message });
    }
  };


  module.exports = {
    addDriver,
  editDriver,
  deleteDriver,
  allDrivers,
  getDriver,
  }