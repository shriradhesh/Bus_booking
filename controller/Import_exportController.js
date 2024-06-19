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






                                                          /* Import and Export Data  */
// APi for Import Buses record -
const import_Buses = async (req, res) => {
    try {
      const workbook = new ExcelJs.Workbook();
      await workbook.xlsx.readFile(req.file.path);
  
      const worksheet = workbook.getWorksheet(1);
      const busesData = [];
  
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber !== 1) {
          // skip the header row
  
          const rowData = {
            bus_type: row.getCell(1).value,
            seating_capacity: row.getCell(2).value,
            bus_no: row.getCell(3).value,
            model: row.getCell(4).value,
            manufacture_year: row.getCell(5).value,
            amenities: row
              .getCell(6)
              .value.split(",")
              .map((item) => item.trim()),
            images: row
              .getCell(7)
              .value.split(",")
              .map((item) => item.trim()),
          };
          busesData.push(rowData);
        }
      });
  
      // insert the buses into the database
  
      const insertedBuses = await BusModel.insertMany(busesData);
  
      res
        .status(200)
        .json({
          success: true,
          message: "Buses imported successfully",
          buses: insertedBuses,
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({
          success: false,
          error: " there is an error while importing Buses",
        });
    }
  };
  
  // Api to create sample_buses
  
  const generate_sampleFile = async (req, res) => {
    try {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Buses");
  
      worksheet.addRow([
        "bus_type",
        "seating_capacity",
        "bus_no",
        "model",
        "manufacturing_year",
        "amenities",
        "images",
      ]);
  
      // Add sample data
      worksheet.addRow([
        "AC",
        28,
        "A11290",
        "Ashok Leyland",
        2018,
        "wifi, AC, TV",
        "image1.jpg",
      ]);
  
      // Set response headers for Excel download with the filename
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sample_Buses.xlsx"
      );
  
      // Send the Excel file as a response
      await workbook.xlsx.write(res);
      res.end();
      console.log("Excel file sent");
    } catch (error) {
      console.error("Error sending Excel file:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  // Api to export Bookings
  const export_Bookings = async (req, res) => {
    try {
      // Fetch all booking data from the booking Database
      const bookings = await BookingModel.find({});
  
      // Create Excel workbook and worksheet
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Bookings");
  
      // Define the Excel Header
      worksheet.columns = [
        {
          header: "Booking ID",
          key: "bookingId",
        },
        {
          header: "User ID",
          key: "userId",
        },
        {
          header: "Trip ID",
          key: "tripId",
        },
        {
          header: "Journey Date",
          key: "date",
        },
        {
          header: "Status",
          key: "status",
        },
        {
          header: "Payment Status",
          key: "paymentStatus",
        },
        {
          header: "Total Fare",
          key: "totalFare",
        },
      ];
  
      // Add Booking data to the worksheet
      bookings.forEach((booking) => {
        worksheet.addRow({
          bookingId: booking.bookingId,
          userId: booking.userId,
          tripId: booking.tripId,
          date: booking.date,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalFare: booking.totalFare,
        });
      });
  
      // Set response headers for downloading the Excel file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
  
      res.setHeader("Content-Disposition", "attachment; filename=bookings.xlsx");
  
      // Generate and send the Excel File as a response
      await workbook.xlsx.write(res);
  
      // End the response
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  // Api for Export Transactions
  const export_Transactions = async (req, res) => {
    try {
      // Fetch all transaction data from the transaction Database
      const transactions = await TransactionModel.find({});
  
      // Create Excel workbook and worksheet
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transactions");
  
      // Define the Excel Header
      worksheet.columns = [
        {
          header: "Booking ID",
          key: "bookingId",
        },
        {
          header: "charge ID",
          key: "chargeId",
        },
        {
          header: "Amount",
          key: "amount",
        },
        {
          header: "Payment Status",
          key: "status",
        },
      ];
  
      // Add transaction data to the worksheet
      transactions.forEach((transaction) => {
        worksheet.addRow({
          bookingId: transaction.bookingId,
          chargeId: transaction.chargeId,
          amount: transaction.amount,
          status: transaction.status,
        });
      });
  
      // Set response headers for downloading the Excel file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
  
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=transactions.xlsx"
      );
  
      // Generate and send the Excel File as a response
      await workbook.xlsx.write(res);
  
      // End the response
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  // Api for export trips
  const export_Trips = async (req, res) => {
    try {
      // Fetch all trips data from the Trip Database
      const trips = await TripModel.find({});
  
      // Create Excel workbook and worksheet
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Trips");
  
      // Define the Excel Header
      worksheet.columns = [
        {
          header: "Trip Number",
          key: "tripNumber",
        },
        {
          header: "Starting Date",
          key: "startingDate",
        },
        {
          header: "End Date",
          key: "endDate",
        },
        {
          header: "Bus no ",
          key: "bus_no",
        },
        {
          header: "Driver Id",
          key: "driverId",
        },
        {
          header: "Route Number",
          key: "routeNumber",
        },
        {
          header: "Source",
          key: "source",
        },
        {
          header: "Destination",
          key: "destination",
        },
        {
          header: "Starting Time",
          key: "startingTime",
        },
        {
          header: "Status",
          key: "status",
        },
        {
          header: "Available_seat",
          key: "Available_seat",
        },
        {
          header: "Booked_seat",
          key: "booked_seat",
        },
        {
          header: "Bus Type",
          key: "bus_type",
        },
        {
          header: "Amenities",
          key: "amenities",
        },
        {
          header: "Bus Images",
          key: "images",
        },
      ];
  
      // Add trips data to the worksheet
      trips.forEach((trip) => {
        worksheet.addRow({
          tripNumber: trip.tripNumber,
          startingDate: trip.startingDate,
          endDate: trip.endDate,
          bus_no: trip.bus_no,
          driverId: trip.driverId,
          routeNumber: trip.routeNumber,
          source: trip.source,
          destination: trip.destination,
          startingTime: trip.startingTime,
          status: trip.status,
          Available_seat: trip.Available_seat,
          booked_seat: trip.booked_seat,
          bus_type: trip.bus_type,
          amenities: trip.amenities,
          images: trip.images,
        });
      });
  
      // Set response headers for downloading the Excel file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
  
      res.setHeader("Content-Disposition", "attachment; filename=trips.xlsx");
  
      // Generate and send the Excel File as a response
      await workbook.xlsx.write(res);
  
      // End the response
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  
  // Api for Export User Data
  const export_Users = async (req, res) => {
    try {
      // Fetch all users data from the users Database
      const users = await UserModel.find({});
  
      // Create Excel workbook and worksheet
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Users");
  
      // Define the Excel Header
      worksheet.columns = [
        {
          header: "Full Name",
          key: "fullname",
        },
        {
          header: "Email",
          key: "email",
        },
        {
          header: "Phone No",
          key: "phone_no",
        },
        {
          header: "Age",
          key: "age",
        },
        {
          header: "Gender",
          key: "gender",
        },
        {
          header: "Profile Image",
          key: "profileImage",
        },
      ];
  
      // Add users' data to the worksheet
      users.forEach((user) => {
        worksheet.addRow({
          fullname: user.fullName,
          email: user.email,
          phone_no: user.phone_no,
          age: user.age,
          gender: user.gender,
          profileImage: user.profileImage,
        });
      });
  
      // Set response headers for downloading the Excel file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
  
      res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");
  
      // Generate and send the Excel File as a response
      await workbook.xlsx.write(res);
  
      // End the response
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };



  module.exports = {
    import_Buses,
  generate_sampleFile,
  export_Bookings,
  export_Transactions,
  export_Trips,
  export_Users,
  }