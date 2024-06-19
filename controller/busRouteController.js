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



                                                       /* stops management   */

//API for add stop in Stop Schema

const createStop = async (req, res) => {
    const { stopName } = req.body;
  
    try {
      const requiredFields = ["stopName"];
  
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
  
      // Check for stopName
      const existStop = await stopModel.findOne({ stopName });
  
      if (existStop) {
        return res
          .status(400)
          .json({ message: " StopName already exist ", success: false });
      }
  
      const newStop = new stopModel({
        stopName: stopName,
      });
      const savedStop = await newStop.save();
  
      return res
        .status(200)
        .json({
          success: true,
          message: `stop added successfully `,
          stop: savedStop,
        });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          success: false,
          message: ` an error occured while adding the stop`,
          error: error,
        });
    }
  };
  
  // get all stops form the Stop Schema
  
  const allStops = async (req, res) => {
    try {
      // check for stops
      const stops = await stopModel.find({});
      if (!stops) {
        return res.status(400).json({
          success: false,
          stopExistanceMessage: "no stops found",
        });
      } else {
            // sroted stops
              const sortedStops = stops.sort((a , b)=> b.createdAt = a.createdAt)
        res
          .status(200)
          .json({ success: true, message: "All Stops", stop_details: sortedStops });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "server error" });
    }
  };
  
  // Delete a particular stop by stopId
  
  const deleteStop = async (req, res) => {
    try {
      const stopId = req.params.stopId;
  
      // Check for route existence
      const existingStop = await stopModel.findOne({ _id: stopId });
      if (!existingStop) {
        return res.status(404).json({ success: false, error: `stop not found` });
      }
  
      // Delete the route from the database
      await existingStop.deleteOne();
  
      res
        .status(200)
        .json({ success: true, message: "Stop deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error while deleting the Stop" });
    }
  };
  

  
  
  
                                                        /* Route Management */
  
  // Api for Add Route
  
  const addRoute = async (req, res) => {
    try {
      const {  routeNumber, source, destination, status, stops } = req.body;
  
      // check field validation
      const requiredFields = [ "routeNumber", "source", "destination"];
  
      for (const field of requiredFields) { 
        if (!req.body[field]) {
          return res
            .status(400)
            .json({
              ReguiredFieldMessage: `Missing ${field.replace("_", " ")} field`,
              success: false,
            });
        }
      }
  
      // check for route existence
      const existRoute = await BusRoute.findOne({ routeNumber });
      if (existRoute) {
        return res
          .status(400)
          .json({
            success: false,
            existRouteMessage: `Route already exists with the route number: ${routeNumber}`,
          });
      }
  
      // Initialize stops array if not provided
      const stopsArray = stops || [];
  
      // Add the first stop
      stopsArray.unshift({
        stopName: source,
        EstimatedTimeTaken: "0 Hour, 0 Minute",
        distance: 0,
      });
  
      const newRoute = new BusRoute({
       
        routeNumber: routeNumber,
        source: source,
        destination: destination,
        stops: stopsArray,
      });
  
      // Save the new route to the database
      await newRoute.save();
  
      return res
        .status(200)
        .json({
          success: true,
          SuccessMessage: "Route added successfully",
          routeNumber: routeNumber,
          details: newRoute,
        });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          success: false,
          errorMessage: "An error occurred while adding the route",
        });
    }
  };
  
  
  // API for Get all route
  
  const allroutes = async (req, res) => {
    try {
      const status = req.query.status;
  
      let Routes;
      if (status === "active" || status === "inactive") {
        Routes = await BusRoute.find({ status: status });
      } else {
        Routes = await BusRoute.find({});
      }
            // sorted routes
          const sortedRoutes = Routes.sort(( a , b )=> b.createdAt - a.createdAt)
      res
        .status(200)
        .json({ success: true, message: "All Routes", Route_Detail: sortedRoutes });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "There is an error to find Routes" + error.message,
        });
    }
  };
  
  // API for Edit Route
  const editRoute = async (req, res) => {
    try {
      const routeId = req.params.routeId;
  
      const { source, destination, status } = req.body;
  
      // Check for route existence
      const existRoute = await BusRoute.findOne({ _id: routeId });
      if (!existRoute) {
        return res
          .status(404)
          .json({ success: false, message: `Route not found` });
      }
  
      // Update the properties of the existing route
  
      existRoute.source = source;
      existRoute.destination = destination;
      existRoute.status = status;
  
      // Save the updated route details to the database
      const updatedRoute = await existRoute.save();
      res
        .status(200)
        .json({
          success: true,
          message: "Route Details Edited Successfully",
          route: updatedRoute,
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({
          success: false,
          message: "Error while editing the route details",
        });
    }
  };
  
  //API for add stop in a bus with bus id
  
   const addStop_in_Route = async (req, res) => {
    const routeId = req.params.routeId;
    const { stopName, EstimatedTimeTaken, distance } = req.body;
  
    try {
      const requiredFields = ["stopName", "EstimatedTimeTaken", "distance"];
  
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
      const route = await BusRoute.findOne({ _id: routeId });
  
      if (!route) {
        return res
          .status(400)
          .json({
            success: false,
            message: `route not found with the routeId ${routeId}`,
          });
      }
      // Check if the stopName exists in the StopModel
      const existingStop = await stopModel.findOne({ stopName });
  
      if (!existingStop) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Stop '${stopName}' does not exist in stops Database`,
          });
      }
      //  stops is an array in the BusRoute model
      const duplicateStop = route.stops.find(
        (stop) => stop.stopName === stopName
      );
  
      if (duplicateStop) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Stop '${stopName}' already exists in a route`,
          });
      }
  
      // Split the EstimatedTimeTaken string into hours and minutes
      const timeParts = EstimatedTimeTaken.split(",");
  
      if (timeParts.length !== 2) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.`,
          });
      }
  
      const [hoursPart, minutesPart] = timeParts.map((part) => part.trim());
  
      const hoursMatch = hoursPart.match(/(\d+)\s*Hour/i);
      const minutesMatch = minutesPart.match(/(\d+)\s*Minute/i);
  
      if (!hoursMatch || !minutesMatch) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.`,
          });
      }
  
      const hours = parseInt(hoursMatch[1]);
      const minutes = parseInt(minutesMatch[1]);
  
      // Calculate the total time in minutes
      const totalMinutes = hours * 60 + minutes;
  
      route.stops.push({
        stopName,
        EstimatedTimeTaken: `${hours} Hour, ${minutes} Minute`,
        distance,
      });
      let savedStop = await route.save();
      // Assuming your data is stored in a variable named 'savedStop'
      const lastStopObjectId = savedStop.stops[savedStop.stops.length - 1]._id;
  
      // Update the Trip model with the new stop
      const trips = await TripModel.find({
        routeNumber: route.routeNumber,
      });
  
      for (const trip of trips) {
        trip.stops.push({
          stopName,
          EstimatedTimeTaken: `${hours} Hour, ${minutes} Minute`,
          distance,
          stop_status: 0,
          _id: lastStopObjectId,
        });
        await trip.save();
      }
  
      return res
        .status(200)
        .json({
          success: true,
          message: `stop added successfully in routeID : ${routeId}`,
        });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          success: false,
          message: ` an error occured while adding the stop`,
          error: error,
        });
    }
  }; 
  
  // const addStop_in_Route = async (req, res) => {
  //   const routeId = req.params.routeId;
  //   const { stopName, arrival_time, departure_time, distance } = req.body;
  
  //   try {
  //     const requiredFields = ["stopName", "arrival_time", "departure_time", "distance"];
  
  //     for (const field of requiredFields) {
  //       if (!req.body[field]) {
  //         return res
  //           .status(400)
  //           .json({
  //             message: `Missing ${field.replace("_", " ")} field`,
  //             success: false,
  //           });
  //       }
  //     }
  //     const route = await BusRoute.findOne({ _id: routeId });
  
  //     if (!route) {
  //       return res
  //         .status(400)
  //         .json({
  //           success: false,
  //           message: `route not found with the routeId ${routeId}`,
  //         });
  //     }
  //     // Check if the stopName exists in the StopModel
  //     const existingStop = await stopModel.findOne({ stopName });
  
  //     if (!existingStop) {
  //       return res
  //         .status(400)
  //         .json({
  //           success: false,
  //           message: `Stop '${stopName}' does not exist in stops Database`,
  //         });
  //     }
  //     //  stops is an array in the BusRoute model
  //     const duplicateStop = route.stops.find(
  //       (stop) => stop.stopName === stopName
  //     );
  
  //     if (duplicateStop) {
  //       return res
  //         .status(400)
  //         .json({
  //           success: false,
  //           message: `Stop '${stopName}' already exists in a route`,
  //         });
  //     }
  
  //     // Split the EstimatedTimeTaken string into hours and minutes
      
  //     route.stops.push({
  //       stopName,
  //       arrival_time, 
  //       departure_time,
  //       distance,
  //     });
  //     let savedStop = await route.save();
  //     // Assuming your data is stored in a variable named 'savedStop'
  //     const lastStopObjectId = savedStop.stops[savedStop.stops.length - 1]._id;
  
  //     // Update the Trip model with the new stop
  //     const trips = await TripModel.find({
  //       routeNumber: route.routeNumber,
  //     });
  
  //     for (const trip of trips) {
  //       trip.stops.push({
  //         stopName,
  //         arrival_time, 
  //         departure_time,
  //         distance,
  //         stop_status: 0,
  //         _id: lastStopObjectId,
  //       });
  //       await trip.save();
  //     }
  
  //     return res
  //       .status(200)
  //       .json({
  //         success: true,
  //         message: `stop added successfully in routeID : ${routeId}`,
  //       });
  //   } catch (error) {
  //     console.error(error);
  //     return res
  //       .status(500)
  //       .json({
  //         success: false,
  //         message: ` an error occured while adding the stop`,
  //         error: error,
  //       });
  //   }
  // }; 
  
  // Api for Edit Stop in a Route
  
   const editStop_in_Route = async (req, res) => {
    let routeId;
    try {
      const stopId = req.params.stopId;
      routeId = req.params.routeId;
  
      const { EstimatedTimeTaken, distance } = req.body;
  
      // Check for route existence
      const existRoute = await BusRoute.findOne({ _id: routeId });
      if (!existRoute) {
        return res
          .status(404)
          .json({ success: false, message: "Route not found" });
      }
  
      // Check if the stops array exists within existRoute
      if (!existRoute.stops || !Array.isArray(existRoute.stops)) {
        return res
          .status(400)
          .json({ success: false, message: "Stops not found in the route" });
      }
  
      // Check for stopIndex
      const existStopIndex = existRoute.stops.findIndex(
        (stop) => stop._id.toString() === stopId
      );
      if (existStopIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Stop not found" });
      }
  
      // Split the EstimatedTimeTaken string into hours and minutes
      const timeParts = EstimatedTimeTaken.split(",");
      if (timeParts.length !== 2) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.",
        });
      }
  
      const [hoursPart, minutesPart] = timeParts.map((part) => part.trim());
  
      const hoursMatch = hoursPart.match(/(\d+)\s*Hour/);
      const minutesMatch = minutesPart.match(/(\d+)\s*Minute/);
  
      if (!hoursMatch || !minutesMatch) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.",
        });
      }
  
      // Extract hours and minutes from the regex matches
      const hours = parseInt(hoursMatch[1]);
      const minutes = parseInt(minutesMatch[1]);
  
      // Update the properties of the stop
      existRoute.stops[
        existStopIndex
      ].EstimatedTimeTaken = `${hours} Hour, ${minutes} Minute`;
      existRoute.stops[existStopIndex].distance = distance;
  
      // Save the updated route back to the database
      await existRoute.save();
      // Update the corresponding Trip model
      const trips = await TripModel.find({ routeNumber: existRoute.routeNumber });
  
      for (const trip of trips) {
        const tripStopIndex = trip.stops.findIndex(
          (stop) => stop._id.toString() === stopId
        );
        if (tripStopIndex !== -1) {
          trip.stops[
            tripStopIndex
          ].EstimatedTimeTaken = `${hours} Hour, ${minutes} Minute`;
          trip.stops[tripStopIndex].distance = distance;
          await trip.save();
        }
      }
      res.status(200).json({
        success: true,
        message: `Stop is edited successfully for routeId: ${routeId}`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: `There is an error to update the stop in routeId: ${routeId}`,
      });
    }
  };
   
  // Api to add stop before the stop in a route
  
  // const editStop_in_Route = async (req, res) => {
  //   let routeId;
  //   try {
  //     const stopId = req.params.stopId;
  //     routeId = req.params.routeId;
  
  //     const { arrival_time, departure_time, distance } = req.body;
  
  //     // Check for route existence
  //     const existRoute = await BusRoute.findOne({ _id: routeId });
  //     if (!existRoute) {
  //       return res
  //         .status(404)
  //         .json({ success: false, message: "Route not found" });
  //     }
  
  //     // Check if the stops array exists within existRoute
  //     if (!existRoute.stops || !Array.isArray(existRoute.stops)) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: "Stops not found in the route" });
  //     }
  
  //     // Check for stopIndex
  //     const existStopIndex = existRoute.stops.findIndex(
  //       (stop) => stop._id.toString() === stopId
  //     );
  //     if (existStopIndex === -1) {
  //       return res
  //         .status(404)
  //         .json({ success: false, message: "Stop not found" });
  //     }
  
  //     // Split the EstimatedTimeTaken string into hours and minutes
  
  //     // Update the properties of the stop
  //     existRoute.stops[
  //       existStopIndex
  //     ].arrival_time = arrival_time;
  //     existRoute.stops[
  //       existStopIndex
  //     ].departure_time = departure_time;
  //     existRoute.stops[existStopIndex].distance = distance;
  
  //     // Save the updated route back to the database
  //     await existRoute.save();
  //     // Update the corresponding Trip model
  //     const trips = await TripModel.find({ routeNumber: existRoute.routeNumber });
  
  //     for (const trip of trips) {
  //       const tripStopIndex = trip.stops.findIndex(
  //         (stop) => stop._id.toString() === stopId
  //       );
  //       if (tripStopIndex !== -1) {
  //         trip.stops[
  //           tripStopIndex
  //         ].arrival_time = arrival_time;
  //         trip.stops[
  //           tripStopIndex
  //         ].departure_time = departure_time;
  //         trip.stops[tripStopIndex].distance = distance;
  //         await trip.save();
  //       }
  //     }
  //     res.status(200).json({
  //       success: true,
  //       message: `Stop is edited successfully for routeId: ${routeId}`,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({
  //       success: false,
  //       message: `There is an error to update the stop in routeId: ${routeId}`,
  //     });
  //   }
  // };
  
  
  const addStopBeforeStop = async (req, res) => {
    const routeId = req.params.routeId;
    const { beforeStopName, stopName, EstimatedTimeTaken, distance } = req.body;
  
    try {
      const requiredFields = [
        "beforeStopName",
        "stopName",
        "EstimatedTimeTaken",
        "distance",
      ];
  
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
  
      const route = await BusRoute.findOne({ _id: routeId });
  
      if (!route) {
        return res
          .status(400)
          .json({
            success: false,
            message: `route not found with the route ID ${routeId}`,
          });
      }
  
      // Check if the stopName exists in the StopModel
      const existingStop = await stopModel.findOne({ stopName });
  
      if (!existingStop) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Stop '${stopName}' does not exist in stops Database`,
          });
      }
  
      const beforeStopIndex = route.stops.findIndex(
        (stop) => stop.stopName === beforeStopName
      );
  
      if (beforeStopIndex === -1) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Stop '${beforeStopName}' not found on the route`,
          });
      }
      //  stops is an array in the BusRoute model
      const duplicateStop = route.stops.find(
        (stop) => stop.stopName === stopName
      );
  
      if (duplicateStop) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Stop '${stopName}' already exists in a route`,
          });
      }
  
      // Split the EstimatedTimeTaken string into hours and minutes
      const timeParts = EstimatedTimeTaken.split(",");
  
      if (timeParts.length !== 2) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.`,
          });
      }
  
      const [hoursPart, minutesPart] = timeParts.map((part) => part.trim());
  
      const hoursMatch = hoursPart.match(/(\d+)\s*Hour/i);
      const minutesMatch = minutesPart.match(/(\d+)\s*Minute/i);
  
      if (!hoursMatch || !minutesMatch) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Invalid EstimatedTimeTaken format. Use 'X Hour, X Minute' format.`,
          });
      }
  
      const hours = parseInt(hoursMatch[1]);
      const minutes = parseInt(minutesMatch[1]);
  
      // Calculate the total time in minutes
      const totalMinutes = hours * 60 + minutes;
  
      const newStop = {
        stopName,
        EstimatedTimeTaken: `${hours} Hour, ${minutes} Minute`,
        distance,
      };
  
      route.stops.splice(beforeStopIndex, 0, newStop);
      await route.save();
  
      return res
        .status(200)
        .json({
          success: true,
          message: `Stop '${stopName}' added successfully before '${beforeStopName}' on routeId: ${routeId}`,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "An error occurred while adding the stop",
          error,
        });
    }
  };
  
  // Delete a particular stop by stopId with the help of bus
  
  const deleteStop_in_Route = async (req, res) => {
    let routeId;
    try {
      const stopId = req.params.stopId;
      routeId = req.params.routeId;
      const existRoute = await BusRoute.findById(routeId);
  
      if (!existRoute) {
        return res
          .status(404)
          .json({ success: false, message: "Route not found" });
      }
  
      // check for stop
      const existStopIndex = existRoute.stops.findIndex(
        (stop) => stop._id.toString() === stopId
      );
      if (existStopIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: " Stop not found" });
      }
      // remove the stop from the stop array
  
      existRoute.stops.splice(existStopIndex, 1);
  
      await BusRoute.findByIdAndUpdate(
        { _id: routeId },
        { stops: existRoute.stops }
      );
      const trips = await TripModel.find({ routeNumber: existRoute.routeNumber });
  
      for (const trip of trips) {
        const tripStopIndex = trip.stops.findIndex(
          (stop) => stop._id.toString() === stopId
        );
        if (tripStopIndex !== -1) {
          trip.stops.splice(tripStopIndex, 1);
          await trip.save();
        }
      }
      res
        .status(200)
        .json({ success: true, message: "stop delete successfully in Route" });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: `there is an error to delete the stop `,
        });
    }
  };
  
  // Api for delete Route
  const deleteRoute = async (req, res) => {
    try {
      const routeId = req.params.routeId;
  
      // Check for route existence
      const existingRoute = await BusRoute.findOne({ _id: routeId });
      if (!existingRoute) {
        return res
          .status(404)
          .json({ success: false, message: `Route not found` });
      }
  
      // Delete the route from the database
      await existingRoute.deleteOne();
  
      res
        .status(200)
        .json({ success: true, message: "Route deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error while deleting the route" });
    }
  };
  
    // Api for get all stops of Route
    const allStops_ofRoute = async(req ,res)=>{
        try {
          const routeId = req.params.routeId
          // check for routeId
      if(!routeId)
      {
            return res.status(400).json({
                         success : false ,
                         routeId_message : 'route Id required'
            })
      }
      // check for route
       const route = await BusRoute.findOne({ _id : routeId })
       if(!route)
       {
        return res.status(400).json({
                  success : false ,
                  route_message : 'route not exist'
        })
       }

          const stops_array = route.stops
        return res.status(200).json({
                success : true ,
                message : 'stops of the route',
                route_no : route.routeNumber,
                stops : stops_array
        })
        } catch (error) {
             return res.status(500).json({
                      success : false ,
                      message : 'server error'
             })
        }
        
       }



  module.exports = {
  createStop,
  allStops,
  deleteStop,
  addRoute,
  allroutes,
  editRoute,
  addStop_in_Route,
  editStop_in_Route,
  addStopBeforeStop,
  deleteStop_in_Route,
  deleteRoute,
  addStopBeforeStop,
  allStops_ofRoute,
  }