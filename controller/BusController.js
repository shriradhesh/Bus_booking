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



                                                /* BUS MANAGEMENT */

// APi for add new bus
const addBus = async (req, res) => {
    try {
      const {
        bus_type,
        seating_capacity,
        bus_no,
        model,
        manufacture_year,
        amenities,
        status,
      } = req.body;
  
      const requiredFields = [
        "bus_type",
        "seating_capacity",
        "bus_no",
        "model",
        "manufacture_year",
        "amenities",
        "status",
      ];
  
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            message: `Missing ${field.replace("_", " ")} field`,
            success: false,
          });
        }
      }
  
      const existBus = await BusModel.findOne({ bus_no });
  
      if (existBus) {
        return res.status(400).json({
          message: "Bus with the same Number is Already Exist",
          success: false,
        });
      }
  
      let imagePaths = [];

        if (req.files && req.files.length > 0) {
            // List of allowed extensions
            const allowedExtensions = ['.jpg', '.jpeg', '.png'];

            // Filter and get the valid files
            imagePaths = req.files
                .map(file => {
                    const fileExtension = path.extname(file.filename).toLowerCase();
                    if (allowedExtensions.includes(fileExtension)) {
                        return file.filename;
                    } else {
                        return null;
                    }
                })
                .filter(filename => filename !== null);

            if (imagePaths.length !== req.files.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only .jpg, .jpeg, and .png files are allowed.'
                });
            }
          } else {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded.'
            });
        }       

      const validStatuses = ["active", "inactive"];
      const busStatus = validStatuses.includes(status) ? status : "active";
  
      let amenities_details;
  
      if (amenities !== undefined && amenities !== "") {
        amenities_details = amenities.split(",").map((item) => item.trim());
      }
  
      const newBus = new BusModel({
        bus_type,
        seating_capacity,
        bus_no,
        model,
        manufacture_year,
        amenities: amenities_details,
        images: imagePaths,
        status: busStatus,
      });
  
      const savedBus = await newBus.save();
  
      res.status(200).json({
        success: true,
        message: "Bus Added successfully",
        Bus: savedBus,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error while adding the Bus",
        error: error.message,
      });
    }
  };
  
  // Api for update bus with id
  
  const updateBus = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            bus_type,
            seating_capacity,
            model,
            manufacture_year,
            amenities,
            status,
            availability,
        } = req.body;

        const existBus = await BusModel.findOne({ _id: id });

        if (!existBus) {
            return res.status(400).json({ message: "Bus Not found", success: false });
        }

        const validStatuses = ["active", "inactive"];
        const validAvailabilities = ["available", "unavailable", "booked"];

        if (!validStatuses.includes(status) || !validAvailabilities.includes(availability)) {
            return res.status(400).json({
                message: "Invalid status or availability value",
                success: false,
            });
        }

        if ((status === "inactive" && availability !== "unavailable") || (availability === "unavailable" && status !== "inactive")) {
            return res.status(400).json({
                message: "Invalid combination of status and availability",
                success: false,
            });
        }

        existBus.bus_type = bus_type;
        existBus.seating_capacity = seating_capacity;
        existBus.model = model;
        existBus.manufacture_year = manufacture_year;

        // Validate and parse amenities
        let amenities_details;
        if (amenities) {
            try {
                // Remove leading and trailing whitespace and quotes, then parse as JSON array
                amenities_details = JSON.parse(amenities.replace(/'/g, '"'));
            } catch (error) {
                return res.status(400).json({ message: "Invalid format for amenities", success: false });
            }
        }

        // Ensure amenities_details is an array and each item is a string
        if (!Array.isArray(amenities_details)) {
            return res.status(400).json({ message: "Invalid format for amenities", success: false });
        }
        amenities_details = amenities_details.map(item => String(item).trim());

        existBus.amenities = amenities_details || [];

        existBus.status = status;
        existBus.availability = availability;

        // Check if req.files exist and if it contains images
        if (req.files && req.files.length > 0) {
            const images = [];

            for (const file of req.files) {
                // Ensure that the file is an image
                if (file.mimetype.startsWith("image/")) {
                    // If the Bus Images already exist, delete the old file if it exists
                    if (existBus.images && existBus.images.length > 0) {
                        existBus.images.forEach((oldFileName) => {
                            const oldFilePath = `uploads/${oldFileName}`;
                            if (fs.existsSync(oldFilePath)) {
                                fs.unlinkSync(oldFilePath);
                            }
                        });
                    }
                    // Add the new image filename to the images array
                    images.push(file.filename);
                }
            }

            // Update the images with the new one(s) or create a new one if it doesn't exist
            existBus.images = images.length > 0 ? images : undefined;
        }

        const updatedBus = await existBus.save();
        res.status(200).json({
            success: true,
            message: "Bus Details Edited Successfully",
            updatedBus,
        });
    } catch (error) {
        console.error("Error while editing the bus details", error);
        // Revert any changes made to the file system if there's an error
        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                const filePath = `uploads/${file.filename}`;
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        res.status(500).json({
            success: false,
            message: "Error while editing the bus details",
            error,
        });
    }
};


  
  
  
  
  

  // Api for delete particular image of a bus

  const deleteBusImageByIndex = async (req, res) => {
    try {
      const busId = req.params.busId;
      const { imageIndex } = req.body;
  
      // Find the bus by ID
      const bus = await BusModel.findOne({ _id : busId });
  
      if (!bus) {
        return res.status(404).json({ success: false, message: "Bus not found" });
      }
  
      // Check if the image index is within the valid range
      if (imageIndex < 0 || imageIndex >= bus.images.length) {
        return res.status(400).json({ success: false, message: "Invalid image index" });
      }
  
      // Get the image name from the images array
      const imageName = bus.images[imageIndex];
  
      // Remove the image from the images array
      bus.images.splice(imageIndex, 1);
  
      // Delete the image file from the filesystem
      const imagePath = `uploads/${imageName}`;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
  
      // Save the updated bus
      await bus.save();
  
      res.status(200).json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      
      res.status(500).json({ success: false, message: "server error", error_message : error.message });
    }
  };
  
  

  // APi for add new image in particular bus 
  const add_new_image_on_bus = async (req, res) => {
    try {
      const { busId } = req.params;
      
      const newImages = req.files.map(file => file.filename); // Get the file paths
  
      // Validate the inputs
      if (!newImages.length === 0) {
        return res.status(400).json({ success: false, message: "at least one image are required" });
      }
  
      // Find the bus by ID
      const bus = await BusModel.
      findOne({_id : busId });
  
      if (!bus) {
        return res.status(404).json({ success: false, message: "BUS not found" });
      }
  
      // Add new images to the bus images array
      bus.images.push(...newImages);
  
      // Save the updated bus document
      await bus.save();
  
      res.status(200).json({ success: true, message: "Images added successfully", Bus_Detail: bus });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error while adding images to the BUS" });
    }
  };
  
  //APi for delete Bus
  
  const deleteBus = async (req, res) => {
    try {
      const busId = req.params.busId;
      const bus = await BusModel.findById(busId);
  
      if (!bus) {
        return res.status(404).json({ success: false, message: "Bus not found" });
      }
  
      if (bus.status === "inactive" && bus.availability === "unavailable") {
        // Check if the bus is booked on other routes
        const routesWithBus = await BusRoute.find({ busId: busId });
        if (routesWithBus.length > 0) {
          return res
            .status(400)
            .json({ success: false, message: "Bus is booked on other routes" });
        }
  
        // If not booked on other routes, delete the bus
        await BusModel.deleteOne({ _id: busId });
        res
          .status(200)
          .json({ success: true, message: "Bus deleted successfully" });
      } else {
        res
          .status(400)
          .json({
            success: false,
            message:
              "Bus cannot be deleted , its currently status : active & Avaialabilty : available ",
          });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error while deleting the Bus" });
    }
  };
  
  //Api for Get All Buses with there status
  const allBuses = async (req, res) => {
    try {
      const status = req.query.status;
  
      let buses;
      if (status === "active") {
        buses = await BusModel.find({
          status: "active",
          availability: { $in: ["available", "booked"] },
        });
      } else if (status === "inactive") {
        buses = await BusModel.find({
          status: "inactive",
          availability: "unavailable",
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status value" });
      }
           // sorted bus
           const sortedBus = buses.sort((a , b)=> b.createdAt - a.createdAt )
      res
        .status(200)
        .json({ success: true, message: "All Buses", Bus_Detail: sortedBus });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "There is an error to find Buses" });
    }
  };
  
  // Api for Get a Route details by Route id
  const getBus = async (req, res) => {
    try {
      const bus_no = req.body.bus_no;
  
      const bus = await BusModel.findOne({ bus_no });
  
      if (!bus) {
        return res.status(404).json({ success: false, message: "BUS not found" });
      }
  
      res
        .status(200)
        .json({ success: true, message: " BUS found", Bus_Detail: bus });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Error while finding the BUS" });
    }
  };
  


  module.exports = {
    addBus,
  updateBus,
  deleteBus,
  allBuses,
  getBus,
  deleteBusImageByIndex,
  add_new_image_on_bus
  }