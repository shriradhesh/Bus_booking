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

    const imagePaths = req.files ? req.files.map((file) => file.filename) : [];
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

    if (
      !validStatuses.includes(status) ||
      !validAvailabilities.includes(availability)
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid status or availability value",
          success: false,
        });
    }

    if (
      (status === "inactive" && availability !== "unavailable") ||
      (availability === "unavailable" && status !== "inactive")
    ) {
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
    if (amenities !== undefined && amenities !== "") {
      try {
        amenities_details = amenities.split(",").map((item) => item.trim());
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid format for amenities", success: false });
      }
    }

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
    res
      .status(200)
      .json({
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
    res
      .status(500)
      .json({
        success: false,
        message: "Error while editing the bus details",
        error,
      });
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

    res
      .status(200)
      .json({ success: true, message: "All Buses", Bus_Detail: buses });
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

/*   stops management   */

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
      res
        .status(200)
        .json({ success: true, message: "All Stops", stop_details: stops });
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
    const { s_no, routeNumber, source, destination, status, stops } = req.body;

    // check field validation
    const requiredFields = ["s_no", "routeNumber", "source", "destination"];

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

    // check for route existance
    const existRoute = await BusRoute.findOne({ routeNumber });
    if (existRoute) {
      return res
        .status(400)
        .json({
          success: false,
          existRouteMessage: `route already exit with the route number : ${routeNumber} `,
        });
    }

    const newRoute = new BusRoute({
      s_no: s_no,
      routeNumber: routeNumber,
      source: source,
      destination: destination,
      stops: stops,
    });

    // Save the new route to the database
    await newRoute.save();

    return res
      .status(200)
      .json({
        success: true,
        SuccessMessage: "Route added successfully ",
        routeNumber: routeNumber,
        details: newRoute,
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        errorMessage: "An error occurred while add route",
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

    res
      .status(200)
      .json({ success: true, message: "All Routes", Route_Detail: Routes });
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

/* Change Profile */
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

    res
      .status(200)
      .json({ success: true, message: "All Drivers", Driver_Details: Drivers });
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
      .json({ success: false, message: "Error while finding the driver" });
  }
};

/* TRIP Management */

//API for create a new trip
const createTrip = async (req, res) => {
  try {
    const {
    
      bus_no,
      driverId,
      routeNumber,
      startingDate,
      endDate,
      startingTime,
      status ,
      eur_per_five_km
    } = req.body;

    const requiredFields = [
      'bus_no',
      'driverId',
      'routeNumber',
      'startingDate',
      'endDate',
      'startingTime',
     
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `missing ${field.replace('_', ' ')} field`, success: false });
      }
    }

      if(!eur_per_five_km)
      {
        return res.status(400).json({
                 success : false ,
                 eur_per_five_km_message : 'eur_per_five_km Required '
        })
      }
      const new_eur_per_five_km = parseFloat(eur_per_five_km);
    var [hours, minutes] = startingTime.split(':');
    var dateObj = new Date();
    dateObj.setHours(hours);
    dateObj.setMinutes(minutes);

    var updateStartingTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if a trip with the same bus number and startingDate already exists
    const existingBus = await TripModel.findOne({
      bus_no,
      startingDate,
    });

    if (existingBus) {
      return res.status(400).json({
        message: 'A trip with the same Bus and starting date already exists',
        success: false,
      });
    }

    // Check if a trip with the same driver ID and startingDate already exists
    const existingDriver = await TripModel.findOne({
      driverId,
      startingDate,
    });

    if (existingDriver) {
      return res.status(400).json({
        DriverExistanceMessage: 'A trip with the same Driver and starting date already exists',
        success: false,
      });
    }
    const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // Concatenate "TR" with the random number
    const  tripNumber = "TR" + randomNumber;
    // check for Trip number
    const existingTripNumber = await TripModel.findOne({
      tripNumber,
    });
    if (existingTripNumber) {
      return res.status(400).json({
        TripExistanceMessage: ' trip number already exist',
        success: false,
      });
    }

    // Check for bus number
    const bus = await BusModel.findOne({ bus_no });

    if (!bus) {
      return res.status(400).json({ BusMessage: 'Bus not found ', success: false });
    }

    const { bus_type, amenities, images , seating_capacity , backSeat_capacity , bus_category
       } = bus;

    // Check for Route number and fetch stops
    const route = await BusRoute.findOne({ routeNumber });

    if (!route) {
      return res.status(400).json({ Routemessage: 'Route not found', success: false });
    }

    const stops = route.stops;
   
     // Ensure that EstimatedTimeTaken is a number for each stop
  const totalDurationInMinutes = stops.reduce((acc, stop) => {
    const [hours, minutes] = stop.EstimatedTimeTaken.split(',').map((str) => parseInt(str.trim()));
    return acc + (hours * 60 + minutes);
  }, 0);
      // Convert total duration to hours and minutes
      const totalHours = Math.floor(totalDurationInMinutes / 60);
      const totalMinutes = totalDurationInMinutes % 60;


      // Create an array for available seats
    const busCapacity = bus.seating_capacity;
    const Available_seat = Array.from({ length: busCapacity }, (_, index) => index + 1);
    
    const newTrip = new TripModel({
      tripNumber,
      startingDate,
      endDate,
      source: route.source,
      destination: route.destination,                                              
      startingTime: `${startingDate}, ${updateStartingTime}`,
      bus_no,
      driverId,
      routeNumber,
      status :  'scheduled',
      Available_seat,
      bus_type,
      amenities,
      images,
      stops,
      seating_capacity,
      backSeat_capacity,
      bus_category,
      eur_per_five_km : new_eur_per_five_km,
      totalDuration: `${totalHours} hour${totalHours !== 1 ? 's' : ''} ${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`,
    });

    const savedTrip = await newTrip.save();
    res.status(200).json({
      success: true,
      SuccessMessage: 'new trip created successfully',
      Trip_Detail: savedTrip,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      ServerErrorMessage: 'there is an error while creating the trip',
    });
  }
};

// schedule a job to update trip status

 cron.schedule('* * * * *', async () => {
                                  try {
                                    const currentDate = new Date();
                                
                                    // find trips with end Date over
                                    const expiredTrips = await TripModel.find({
                                      endDate: {
                                        $lt: currentDate,
                                      },
                                      status: { $ne: 'completed' }, 
                                    });
                                
                                    if (expiredTrips.length > 0) {
                                      await TripModel.updateMany(
                                        {
                                          _id: {
                                            $in: expiredTrips.map((trip) => trip._id),
                                          },
                                        },
                                        {
                                          status: 'completed',
                                        }
                                      );
                                    }
                                  } catch (error) {
                                    console.error('Error while updating trip status:', error);
                                  }
                                });



// Api to get all the Trip for a particular StartingDate
const allTrips = async (req, res) => {
  try {
    const { status } = req.query;

    // Validate if a valid status is provided
    if (status && !["scheduled", "cancelled", "completed"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status provided", success: false });
    }

    // Filter trips based on status
    let query = {};
    if (status) {
      query = { status };
    }

    // Find trips with the specified query and sort by creation timestamp in descending order
    const trips = await TripModel.find(query).sort({ createdAt: -1 });

    if (trips.length === 0) {
      return res
        .status(404)
        .json({
          notripMessage: `No trips found for the specified status: ${status}`,
          success: false,
        });
    }
          
    res.status(200).json({ success: true, trips });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        ServerErrorMessage: "There was an error while fetching trips",
      });
  }
};



// Api for get trip by tripId
          const getTrip = async(req , res)=>{
             try {
                    const tripId = req.params.tripId
                    // check for tripId
                if(!tripId)
                {
                  return res.status(400).json({
                       success : false ,
                       tripId_message : 'trip id required'
                  })
                }

                // check for trip
                const trip = await TripModel.findOne({ _id : tripId })
                if(!trip)
                {
                  return res.status(400).json({
                         success : false ,
                         trip_message : 'trip not found'
                  })
                }
                else
                {
                  return res.status(200).json({
                        success : true ,
                        message : 'trip Details',
                        trip_details : trip
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
// Api for searchtrips

const searchTrips = async (req, res) => {
  try {
    const { sourceStop, destinationStop, date } = req.body;
    if (!sourceStop) {
      return res.status(400).json({
        success: false,
        sourceStopExistance: 'sourceStop required'
      });
    }
    if (!destinationStop) {
      return res.status(400).json({
        success: false,
        destinationStopExistance: 'destinationStop required'
      });
    }
    if (!date) {
      return res.status(400).json({
        success: false,
        dateExistance: 'date required'
      });
    }

    // Find trips that match the given date
    const trips = await TripModel.find({
      startingDate: date,
      status: "scheduled"
    });

    if (!trips || trips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No matching trips found for the selected date'
      });
    }

    // Filter trips to include only those with matching source and destination stops
    const matchingTrips = [];

    for (const trip of trips) {
      const sourceIndex = trip.stops.findIndex((stop) => stop.stopName === sourceStop);
      const destinationIndex = trip.stops.findIndex((stop) => stop.stopName === destinationStop);

      if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex) {
        const stops = trip.stops.map((stop) => stop.stopName);
      
        const stopsDuration = calculateTotalDuration(trip.stops, sourceIndex, destinationIndex);
        const arrivalTime = ArrivalTime(trip, sourceStop);
        const departureTime = DepartureTime(trip, sourceStop)

        matchingTrips.push({
          trip: trip,
          stopsDuration: stopsDuration,
          ArrivalTime: arrivalTime,
          DepartureTime: departureTime
        });
      }
    }

    if (matchingTrips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No matching trips found for the selected stops'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trips for the search criteria',
      trips: matchingTrips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error while fetching the data',
      error_message: error.message
    });
  }
};


const calculateTotalDuration = (stops, sourceIndex, destinationIndex) => {
  let totalHours = 0;
  let totalMinutes = 0;

  for (let i = sourceIndex; i <= destinationIndex; i++) {
    if (i === sourceIndex) {
      // For the source stop, set the duration to 0
      totalHours += 0;
      totalMinutes += 0;
    } else {
      const stop = stops[i];
      const haltTime = stop.stop_halt || "0 Hour, 0 Minute"; // If stop_halt doesn't exist, default to "0 Hour, 0 Minute"
      const [haltHours, haltMinutes] = haltTime.split(' Hour, ');

      if (stop.EstimatedTimeTaken) {
        const [estHours, estMinutes] = stop.EstimatedTimeTaken.split(' Hour, ');

        totalHours += parseInt(estHours);
        totalMinutes += parseInt(estMinutes.replace(' Minute', ''));
      }

      // Add halt time
      totalHours += parseInt(haltHours);
      totalMinutes += parseInt(haltMinutes.replace(' Minute', ''));
    }
  }

  // Convert excess minutes to hours
  totalHours += Math.floor(totalMinutes / 60);
  totalMinutes = totalMinutes % 60;

  return { hours: totalHours, minutes: totalMinutes };
};


const ArrivalTime = (trip, sourceStop) => {
  // Find the index of the source stop
  var sourceIndex = trip.stops.findIndex(stop => stop.stopName === sourceStop);
  var sourceStop_halt = trip.stops[sourceIndex].stop_halt || "0 Hour, 0 Minute";
 
  // If source stop not found, return null indicating invalid data
  if (sourceIndex === -1) {
      return null;
  }
  // If the source stop is the first stop, return the starting time of the trip
  if (sourceIndex === 0) {
      return `${trip.startingTime}`;
  }   
    // Parse starting time
    var [startingDate, startingTime] = trip.startingTime.split(', ');
    var [startingTimeHours, startingTimeMinutes, ampm] = startingTime.split(/:| /).map(part => parseInt(part) || part);
    
    // Calculate the total estimated time until the source stop
    var totalEstimatedTime = calculateTotalDuration(trip.stops, 0, sourceIndex);

    // Calculate arrival hours and minutes
    let arrivalHours = startingTimeHours + totalEstimatedTime.hours;
      
    let arrivalMinutes = startingTimeMinutes + totalEstimatedTime.minutes;
    let arrivalMinutesString = arrivalMinutes.toString();

      // Remove the first two characters
      let finalMinutes = arrivalMinutesString.slice(2);
      
    // Adjust total hours and minutes
    if (arrivalMinutes >= 60) {
        arrivalHours += Math.floor(finalMinutes / 60);
        finalMinutes %= 60;
    }

    // Adjust AM/PM if necessary
    if (arrivalHours >= 12 && ampm === 'am') {
        ampm = 'pm';
    } else if (arrivalHours >= 12 && ampm === 'pm') {
        ampm = 'am';
    }

    // Convert 24-hour format to 12-hour format
    if (arrivalHours > 12) {
        arrivalHours -= 12;
    }

    // Format the final arrival time
    var formattedArrivalTime = ` ${arrivalHours}:${finalMinutes} ${ampm}`;




    function timeToMinutes(timeStr) {
      let [hours, minutes] = timeStr.match(/\d+/g).map(Number); // Extract hours and minutes using regex
      if (timeStr.includes("pm") && hours !== 12) {
          hours += 12; // Convert to 24-hour format if PM and not already 12 PM
      }
      return hours * 60 + minutes;
  }
  
  // Function to format time
  function formatTime(minutes) {
      let hours = Math.floor(minutes / 60) % 24;
      let mins = minutes % 60;
      let ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert to 12-hour format
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }
  
  // Convert sourceStop_halt to minutes
  let sourceStopMinutes = timeToMinutes(sourceStop_halt);
  
  // Convert formattedArrivalTime to minutes
  let arrivalMinutes2 = timeToMinutes(formattedArrivalTime);
  
  // Subtract source stop halt from arrival time
  let outputMinutes = arrivalMinutes2 - sourceStopMinutes;
  
  // Format the output time
  let formattedOutputTime = formatTime(outputMinutes);


    var formattedArrivalTime1 = `${startingDate}, ${formattedOutputTime}`;
         
    return formattedArrivalTime1;
};

const DepartureTime = (trip, sourceStop) => {
  // Find the index of the source stop
  var sourceIndex = trip.stops.findIndex(stop => stop.stopName === sourceStop);

  // If source stop not found, return null indicating invalid data
  if (sourceIndex === -1) {
    return null;
  }

  // If the source stop is the first stop, return the starting time of the trip
  if (sourceIndex === 0) {
    return `${trip.startingTime}`;
  }

  // Parse starting time
  var [startingDate, startingTime] = trip.startingTime.split(', ');
  var [startingTimeHours, startingTimeMinutes, ampm] = startingTime.split(/:| /).map(part => parseInt(part) || part);

  // Adjust starting time for AM/PM
  if (ampm === 'pm' && startingTimeHours !== 12) {
    startingTimeHours += 12;
  }

  // Calculate the total estimated time until the source stop
  var totalEstimatedTime = calculateTotalDuration(trip.stops, 0, sourceIndex);

  // Convert total estimated time to hours and minutes
  let departureHours = startingTimeHours + totalEstimatedTime.hours;
  let departureMinutes = startingTimeMinutes + totalEstimatedTime.minutes;

  // Adjust for overflow in minutes
  if (departureMinutes >= 60) {
    departureHours += Math.floor(departureMinutes / 60);
    departureMinutes %= 60;
  }

  // Adjust for overflow in hours
  departureHours %= 24;

  // Determine AM/PM for departure time
  let resultPeriod = departureHours < 12 ? 'AM' : 'PM';

  // Convert to 12-hour format
  if (departureHours > 12) {
    departureHours -= 12;
  }
  var stringWithoutLeadingDigits = departureMinutes.slice(2);
  // Format the final departure time
  var formattedDepartureTime = `${startingDate}, ${departureHours}:${stringWithoutLeadingDigits < 10 ? '0' : ''}${stringWithoutLeadingDigits} ${resultPeriod}`;

  // Log and return the formatted departure time
  return formattedDepartureTime;
};








// Api for filter trip 


var filterTrips = async function(req, res) {
  try {
    var sourceStop = req.body.sourceStop;
    var destinationStop = req.body.destinationStop;
    var date = req.body.date;
    var busType = req.body.busType;
    var arrivalTimeRange = req.body.arrivalTimeRange;

    // Check for required fields
    if (!sourceStop || !destinationStop || !date) {
      return res.status(400).json({
        success: false,
        message: 'sourceStop, destinationStop, and date are required fields'
      });
    }

    // Find trips that match the given date
    var trips = await TripModel.find({
      startingDate: date,
      status: "scheduled"
    });

    if (!trips || trips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No matching trips found for the selected date'
      });
    }

    // Filter trips based on source and destination stops
    var matchingTrips = [];
    for (var i = 0; i < trips.length; i++) {
      var trip = trips[i];
      var routeNumber = trip.routeNumber;
      var route = await BusRoute.findOne({ routeNumber });

      if (!route) {
        continue;
      }

      var sourceIndex = route.stops.findIndex(stop => stop.stopName === sourceStop);
      var destinationIndex = route.stops.findIndex(stop => stop.stopName === destinationStop);

      if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex) {
        var stopsDuration = calculateTotalDuration(route.stops, sourceIndex, destinationIndex);
        var arrivalTime = ArrivalTime(trip, sourceStop);
        const departureTime = DepartureTime(trip, sourceStop)

        var arrivalDate = arrivalTime.split(', ')[0];
        var aTime = arrivalTime.split(',')[1].trim();          
        var resultArrivalTime = arrivalDate + ", " + aTime;

        matchingTrips.push({
          trip: trip,
          stopsDuration: stopsDuration,
          ArrivalTime: resultArrivalTime,
          DepartureTime: departureTime
        });
      }
    }

    // Apply additional filters if provided
    if (busType) {
      var busTypes = busType.split(',').map(type => type.trim());
      matchingTrips = matchingTrips.filter(trip => busTypes.includes(trip.trip.bus_type));
    }

    // Apply arrival time range filter
    if (arrivalTimeRange) {
      var ranges = arrivalTimeRange.split('-').map(range => range.trim());
      matchingTrips = matchingTrips.filter(trip => {
        var arrivalTime = trip.ArrivalTime.split(',')[1].trim();
        return isBetweenTime(arrivalTime, ranges[0], ranges[1]);
      });
    }

    // Check if any matching trips found
    if (matchingTrips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No matching trips found for the selected criteria'
      });
    }

    // Send the matching trips in the response
    res.status(200).json({
      success: true,
      message: 'Trips for the search criteria',
      trips: matchingTrips
    });
  } catch (error) {
    console.error('Error while filtering trips:', error);
    res.status(500).json({
      success: false,
      message: 'Error while fetching the data',
      error_message: error.message
    });
  }
};

// Custom function to check if a given time falls within a specified time range
function isBetweenTime(time, startTime, endTime) {
  // Convert time strings to hours and minutes
  var [startHour, startMinute, startPeriod] = startTime.split(/:|\s/).map(str => str.trim());
  var [endHour, endMinute, endPeriod] = endTime.split(/:|\s/).map(str => str.trim());
  var [arrivalHour, arrivalMinute, arrivalPeriod] = time.split(/:|\s/).map(str => str.trim());

  // Convert periods to lowercase for case-insensitive comparison
  startPeriod = startPeriod ? startPeriod.toLowerCase() : '';
  endPeriod = endPeriod ? endPeriod.toLowerCase() : '';
  arrivalPeriod = arrivalPeriod ? arrivalPeriod.toLowerCase() : '';

  // Convert to 24-hour format if necessary
  if (startPeriod === 'pm' && startHour !== '12') {
    startHour = parseInt(startHour) + 12;
  } else if (startPeriod === 'am' && startHour === '12') {
    startHour = 0;
  }
  if (endPeriod === 'pm' && endHour !== '12') {
    endHour = parseInt(endHour) + 12;
  } else if (endPeriod === 'am' && endHour === '12') {
    endHour = 0;
  }
  if (arrivalPeriod === 'pm' && arrivalHour !== '12') {
    arrivalHour = parseInt(arrivalHour) + 12;
  } else if (arrivalPeriod === 'am' && arrivalHour === '12') {
    arrivalHour = 0;
  }

  // Check if arrival time is within the range
  return (
    (arrivalHour > startHour || (arrivalHour === startHour && arrivalMinute >= startMinute)) &&
    (arrivalHour < endHour || (arrivalHour === endHour && arrivalMinute <= endMinute))
  );
}



// views seats 

const viewSeats = async (req, res) => {
  try {
    const tripId = req.body.tripId;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        tripId: "tripId required",
      });
    }

    // Find the trip by its ID
    const trip = await TripModel.findById(tripId);

    if (!trip) {
      return res.status(404).json({ success: false, error: "Trip not found" });
    }

    let tripNumber = trip.tripNumber;
    const seatCapacity = trip.seating_capacity;

    const backSeat_capacity = trip.backSeat_capacity;
    const resultSeat = seatCapacity - backSeat_capacity;

    // Initialize seats array with status codes
    let seats = [];

    const bookingsOnDate = await BookingModel.find({
      tripId,
      status: "confirmed",
    });

    // If there are bookings on the given trip, populate seats array
    if (bookingsOnDate.length > 0) {
      const bookedSeats = [].concat(
        ...bookingsOnDate.map((booking) => booking.selectedSeatNumbers)
      );

      // Calculate panorama, window, and classic seats
      for (let seat = 1; seat <= seatCapacity; seat++) {
        const status = bookedSeats.includes(seat) ? 1 : 0;
        let seatType = getSeatType(seat);
        seats.push({ seat, status, seatType });
      }
    } else {
      // Calculate panorama, window, and classic seats
      for (let seat = 1; seat <= seatCapacity; seat++) {
        const status = 0;
        let seatType = getSeatType(seat);
        seats.push({ seat, status, seatType });
      }
    }

    // Update the seat type of specified seats to 'Panorama Seat'
    [1, 2, 5, 6, 7].forEach((panoramaSeat) => {
      seats[panoramaSeat - 1].seatType = "Panorama Seat";
    });

    // Update the seat type of the second to last seat to 'Classic Seat'
    if (seats.length >= 2) {
      seats[seats.length - 2].seatType = "Classic Seat";
    }
    if (seats.length >= 2) {
      seats[seats.length - 57].seatType = "Reserved Seat";
    }

    res.status(200).json({
      success: true,
      message: "Seat information of a Bus in a Trip",
      tripNumber: tripNumber,
      Seat_Info: seats,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Error while fetching seat information" });
  }
};

// Function to determine seat type based on seat number
const getSeatType = (seatNumber) => {
  const windowSeatsPattern = [
    3, 8, 12, 15, 16, 20, 21, 25, 26, 30, 31, 35, 36, 40, 41, 45, 46, 50, 51,
    55, 58, 59, 63, 64, 69,
  ];
  return windowSeatsPattern.includes(seatNumber)
    ? "Window Seat"
    : "Classic Seat";
};

// APi for calculateFareFor selected seats in Bus for trip

const calculateFareForSelectedSeats = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const { selectedSeatNumbers, passengerAges } = req.body;
    const { sourceStop, destinationStop } = req.query;

    // Find the trip by its ID
    const trip = await TripModel.findById(tripId);

    if (!trip) {
      return res
        .status(400)
        .json({ success: false, message: "Trip not found" });
    }

    if (
      !Array.isArray(selectedSeatNumbers) ||
      selectedSeatNumbers.length === 0 ||
      selectedSeatNumbers.some((seatNumber) => isNaN(seatNumber)) ||
      !Array.isArray(passengerAges) ||
      passengerAges.length === 0 ||
      passengerAges.some((age) => isNaN(age))
    ) {
      return res.status(400).json({
        message: "Invalid or empty selected seat numbers or passenger ages",
        success: false,
      });
    }

    // Access the available seats from the trip
    const availableSeats = trip.Available_seat || [];
    const routeNumber = trip.routeNumber;

    // Calculate the distance between source and destination stops
    const route = await BusRoute.findOne({ routeNumber });
    if (!route) {
      return res.status(400).json({
        success: false,
        error: "Route not found",
      });
    }

    const stops = route.stops || [];
    const distance = calculateDistanceBetweenStops(
      stops,
      sourceStop,
      destinationStop
    );

    // Calculate fares for each passenger based on age group
    const fares = selectedSeatNumbers.map((seatNumber, index) => {
      // Check the bus type and set farePerUnitDistance accordingly
      let farePerUnitDistance;
      // Inside the calculateFareForSelectedSeats function

      const bus_no = trip.bus_no;

      const bus = BusModel.findOne({
        bus_no,
      });
      if (!bus_no) {
        return res.status(400).json({
          success: false,
          message: "Bus not found",
        });
      }

      let bus_type = trip.bus_type;
      let eur_per_five_km = trip.eur_per_five_km;
      farePerUnitDistance = eur_per_five_km / 5;

      // Within the switch statement
      // switch (bus_type) {
      //   case 'Non-AC' || 'Non-Ac':

      //     farePerUnitDistance = 0.2;
      //     break;
      //   case 'AC' || 'Ac':

      //     farePerUnitDistance = 0.24;
      //     break;
      //   case 'luxury':

      //     farePerUnitDistance = 0.3;
      //     break;
      //   default:
      //     console.log("Fare type: Default");
      //     farePerUnitDistance = 0.2;
      // }

      // Calculate the age group of the passenger
      const ageGroup = calculateAgeGroup(passengerAges[index]);

      // Calculate the total fare for the passenger
      const totalFare = distance * farePerUnitDistance;

      // Calculate the seat fare based on age group
      let seatFare;
      switch (ageGroup) {
        case "baby":
          seatFare = 0.0; // Babies travel free
          break;
        case "children":
          seatFare = totalFare * 0.5; // Half fare for children
          break;
        case "adult":
          seatFare = totalFare; // Full fare for adults
          break;
        default:
          seatFare = totalFare;
      }

      return {
        success: true,
        message: "Fare calculated successfully",
        busType: bus_type,
        boardingPoint: sourceStop,
        droppingPoint: destinationStop,
        seatNumber: seatNumber,
        Fare_in_Euro: totalFare,
        passengerAge: passengerAges[index],
        ageGroup: ageGroup,
        seatFare: seatFare,
      };
    });
    // Calculate the total fare by summing up the seat fares of all passengers
    const totalFare = fares.reduce(
      (acc, passenger) => acc + passenger.seatFare,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Total fare calculated successfully",
      totalFare_in_Euro: totalFare,
      passengersfare: fares,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        error: "An error occurred while calculating fare",
      });
  }
};

// Helper function to calculate distance between stops
function calculateDistanceBetweenStops(stops, sourceStop, destinationStop) {
  const sourceIndex = stops.findIndex((stop) => stop.stopName === sourceStop);
  const destinationIndex = stops.findIndex(
    (stop) => stop.stopName === destinationStop
  );

  if (
    sourceIndex === -1 ||
    destinationIndex === -1 ||
    sourceIndex >= destinationIndex
  ) {
    return 0;
  }

  let distance = 0;
  for (let i = sourceIndex; i < destinationIndex; i++) {
    distance += stops[i + 1].distance - stops[i].distance;
  }

  return distance;
}

function calculateAgeGroup(age) {
  if (age > 0 && age <= 2) {
    return "baby";
  } else if (age > 2 && age <= 21) {
    return "children";
  } else {
    return "adult";
  }
}

/*  Manage Tickit */

// api for book tickit

const bookTicket = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      journey_date,
      selectedSeatNumbers,
      status,
      email,
      passengers,
      totalFare_in_Euro,
      payment,
      payment_key,
      mtnResponse,
      xReferenceId,
      mtnApiKey,
    } = req.body;

    const { source, destination } = req.query;

    const date = new Date(journey_date);

    // Checking for required fields in the request
    const requiredFields = [
      "email",
      "totalFare_in_Euro",
      "selectedSeatNumbers",
      "passengers",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `Missing ${field.replace("_", " ")} field`,
          success: false,
        });
      }
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "Trip ID is missing or undefined",
      });
    }

    // Fetching user details
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const userFullName = user.fullName;
    const userId = user._id;

    // Fetch trip and check if it exists
    const trip = await TripModel.findById(tripId);
    const tripNumber = trip.tripNumber;

    if (!trip) {
      return res.status(400).json({
        success: false,
        message: "Trip not found",
      });
    }

    const bus_no = trip.bus_no;

    if (!bus_no) {
      return res.status(400).json({
        success: false,
        message: "busId not found",
      });
    }

    const bus = await BusModel.findOne({ bus_no });
    if (!bus) {
      return res.status(400).json({
        success: false,
        message: "Bus Details not found",
      });
    }

    const driverId = trip.driverId;
    const Driver = await DriverModel.findOne({ driverId });

    if (!Driver) {
      return res.status(400).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (
      !Array.isArray(selectedSeatNumbers) ||
      selectedSeatNumbers.length !== passengers.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid selected seat numbers",
      });
    }

    // Check if selected seats are available in the trip's Available_seat array

    for (const seat of selectedSeatNumbers) {
      if (!trip.Available_seat.includes(seat)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat} is already booked`,
        });
      }
    }

    // Check if selected seat is already booked in a trip
    const bookedSeats = trip.booked_seat || [];

    for (const seat of selectedSeatNumbers) {
      if (bookedSeats.includes(seat)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat} is already booked`,
        });
      }
    }

    // Update Available_seat and bookedSeats arrays in the trip
    if (Array.isArray(trip.Available_seat)) {
      for (const seat of selectedSeatNumbers) {
        const index = trip.Available_seat.indexOf(seat);
        if (index !== -1) {
          trip.Available_seat.splice(index, 1);
          trip.booked_seat.push(seat);
        }
      }
    }

    // Check if selected seats are already booked on the same date in the booking model
    const existingBookings = await BookingModel.find({
      tripId,
      date,
      status: "confirmed",
      selectedSeatNumbers: {
        $in: selectedSeatNumbers,
      },
    });

    if (existingBookings.length > 0) {
      // Some selected seats are already booked for the same trip and date
      const bookedSeatNumbers = existingBookings.map(
        (booking) => booking.selectedSeatNumbers
      );

      return res.status(400).json({
        success: false,
        message: `Seats ${selectedSeatNumbers.join(
          ", "
        )} are already booked for this trip`,
      });
    }

    const totalFareInCents = totalFare_in_Euro * 100;
    // check for payment key for payment method
    // here 1 for stripe
    // here 2 for mtn momo
    if (payment_key === 1) {
      try {
        const charge = await stripe.charges.create({
          amount: totalFareInCents,
          currency: "usd",
          description: "Bus ticket booking",
          source: payment,
          receipt_email: email,
        });

        const charge_status = charge.status;

        if (!charge_status) {
          res.status(400).json({
            success: false,
            message: "Payment failed",
            payment_status: charge_status,
            error_message: charge.message,
          });
        } else {
          // Check if this booking ID has already been paid
          const bookingId = shortid.generate();

          const existingTransaction = await TransactionModel.findOne({
            bookingId: bookingId,
          });
          if (existingTransaction) {
            return res.status(400).json({
              success: false,
              message: "Booking has already been paid",
            });
          }

          // Store the payment transaction
          const transaction = new TransactionModel({
            bookingId: bookingId,
            chargeId: charge.id,
            amount: totalFare_in_Euro,
            currency: "usd",
            payment_status: charge_status,
            payment_key: payment_key,
          });

          await transaction.save();
          const newNotification = new NotificationDetail({
            userId,
            message: `congratulation ..!! , new booking has been made with bookingId : ${bookingId} `,
            date: date,
            status: "confirmed",
            bookingId: bookingId,
            tripId,
            notification_status: 0,
          });
          await newNotification.save();
          await transaction.save();
          const newAdminNotification = new AdminNotificationDetail({
            userId,
            message: `congratulation ..!! , new booking has been made by the user : ${userFullName} in a trip : ${tripNumber} with bookingId : ${bookingId} `,
            date: date,
            status: "confirmed",
            bookingId: bookingId,
            tripId,
          });
          await newAdminNotification.save();

          // Save the updated trip
          await trip.save();

          // Create a new booking
          const booking = new BookingModel({
            tripId,
            tripNumber,
            date,
            status,
            bookingId,
            userId,
            selectedSeatNumbers,
            passengers: passengers.map((passenger, index) => ({
              ...passenger,
              seatNumber: selectedSeatNumbers[index],
              ageGroup: calculateAgeGroup(passenger.age),
            })),
            totalFare: totalFare_in_Euro,
            source,
            destination,
            userEmail: email,
          });

          await booking.save();

          // Generate passenger details and email content
          const passengerDetails = passengers
            .map((passenger, index) => {
              const seatNumber = selectedSeatNumbers[index];
              return `
                                                        <tr>
                                                        <td style="border: 2px solid #dadada; border-right: 0; border-left: 0; padding: 10px; font-size: 18px; white-space: nowrap;">
                                                          ${passenger.name}
                                                        </td>
                                                        <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                          ${passenger.age}
                                                        </td>
                                                        <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                          ${passenger.gender}
                                                        </td>
                                                        <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                                          ${seatNumber}
                                                        </td>                                              
                                                      </tr>
                                                    `;
            })
            .join("\n");

          const emailContent = `
                                                    <main>
                                                    <div style="width: 80%; margin: 40px auto; padding: 20px; background-color: #fff; border: 2px solid #000; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                                                    <div>
                                                    <img src="https://itdevelopmentservices.com/insphire/public/image/front/img/logo.png" alt="InspHired" style="width: 25%;">
                                                    <h2 style="font-size: 28px; font-weight: 700; color: #000; margin: 0%; text-align: right;">Bus Ticket</h2>
                                                  </div>
                                                      <hr style="border-top: 2px solid #000;">
                                                      <div style="margin-top: 20px;">
                                                        <p style="font-size: 18px; margin-bottom: 10px;"><strong>Dear ${user.fullName},</strong></p>
                                                        <p style="font-size: 16px; margin-bottom: 20px;">Your booking for departure on ${date} has been confirmed.</p>
                                                        <table style="width: 100%; border-collapse: collapse;">
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Booking ID</th>
                                                            <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${bookingId}</td>
                                                          </tr>
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Trip Number</th>
                                                            <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${trip.tripNumber}</td>
                                                          </tr>
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Bus Number</th>
                                                            <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${trip.bus_no}</td>
                                                          </tr>
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Driver Name</th>
                                                            <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${Driver.driverName}</td>
                                                          </tr>
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Driver Contact</th>
                                                            <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${Driver.driverContact}</td>
                                                          </tr>
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Trip Starting Time</th>
                                                            <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${trip.startingTime}</td>
                                                          </tr>
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Your Source</th>
                                                            <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${source}</td>
                                                          </tr>
                                                          <tr>
                                                            <th style="padding: 10px; text-align: left; font-size: 18px;"><strong>Your Destination</strong></th>
                                                            <td style="padding: 10px; font-size: 18px;">${destination}</td>
                                                          </tr>
                                                        </table>
                                                        <!-- Passenger Details Section -->
                                                        <div style="margin-top: 20px;">
                                                          <h3 style="font-size: 24px; font-weight: 700; color: #000; margin-bottom: 10px;">Passenger Details</h3>
                                                          <table style="width: 100%; border-collapse: collapse; text-align: center;">
                                                            <tr>
                                                              <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Passenger Name</th>
                                                              <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Age</th>
                                                              <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Gender</th>
                                                              <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Seat Number</th>
                                                            </tr>
                                                            ${passengerDetails}
                                                          </table>
                                                        </div>
                                                      </div>
                                                      <!-- Footer -->
                                                      
                                                    </div>
                                                  </main>
                                                  
                                                      `;

          // Generate the QR CODE and send the booking confirmation email
          const qrCodeData = `http://192.168.1.41:4000/${bookingId}`;
          const qrCodeImage = "ticket-QRCODE.png";
          await qrcode.toFile(qrCodeImage, qrCodeData);

          await sendBookingEmail(
            email,
            "Your Booking has been confirmed",
            emailContent
          );

          res.status(200).json({
            success: true,
            message: "Booking",
            status: charge_status,
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "error for payment",
          error_message: error.message,
        });
      }
    }

    if (payment_key === 2) {
      try {
        const newBookingId = shortid.generate();

        const existingTransaction = await TransactionModel.findOne({
          bookingId: newBookingId,
        });

        if (existingTransaction) {
          return res.status(400).json({
            success: false,
            message: "Booking has already been paid",
          });
        }

        // Store the payment transaction
        const transaction = new TransactionModel({
          bookingId: newBookingId,
          chargeId: mtnResponse.financialTransactionId,
          partyId: mtnResponse.payer.partyId,
          externalId: mtnResponse.externalId,
          xReferenceId: xReferenceId,
          amount: totalFare_in_Euro,
          currency: mtnResponse.currency,
          mtnApiKey: mtnApiKey,
          payment_status: mtnResponse.status,
          payment_key: payment_key,
        });

        await transaction.save();

        // Save notifications
        const userNotification = new NotificationDetail({
          userId,
          message: `Congratulations! A new booking has been made with bookingId: ${newBookingId}`,
          date: date,
          status: "confirmed",
          bookingId: newBookingId,
          tripId,
          notification_status: 0,
        });

        const adminNotification = new AdminNotificationDetail({
          userId,
          message: `Congratulations! A new booking has been made by the user: ${userFullName} in trip: ${tripNumber} with bookingId: ${newBookingId}`,
          date: date,
          status: "confirmed",
          bookingId: newBookingId,
          tripId,
        });

        await userNotification.save();
        await adminNotification.save();

        // Save the updated trip
        await trip.save();

        // Create a new booking
        const booking = new BookingModel({
          tripId,
          tripNumber,
          date,
          status,
          bookingId: newBookingId,
          userId,
          selectedSeatNumbers,
          passengers: passengers.map((passenger, index) => ({
            ...passenger,
            seatNumber: selectedSeatNumbers[index],
            ageGroup: calculateAgeGroup(passenger.age),
          })),
          totalFare: totalFare_in_Euro,
          source,
          destination,
          userEmail: email,
        });

        await booking.save();
        // Generate passenger details and email content
        const passengerDetails = passengers
          .map((passenger, index) => {
            const seatNumber = selectedSeatNumbers[index];
            return `
                                             <tr>
                                             <td style="border: 2px solid #dadada; border-right: 0; border-left: 0; padding: 10px; font-size: 18px; white-space: nowrap;">
                                               ${passenger.name}
                                             </td>
                                             <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                               ${passenger.age}
                                             </td>
                                             <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                               ${passenger.gender}
                                             </td>
                                             <td style="border: 2px solid #dadada; padding: 10px; font-size: 18px; border-right: 0; white-space: nowrap;">
                                               ${seatNumber}
                                             </td>                                              
                                           </tr>
                                         `;
          })
          .join("\n");

        const emailContent = `
                                         <main>
                                         <div style="width: 80%; margin: 40px auto; padding: 20px; background-color: #fff; border: 2px solid #000; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                                         <div>
                                         <img src="https://itdevelopmentservices.com/insphire/public/image/front/img/logo.png" alt="InspHired" style="width: 25%;">
                                         <h2 style="font-size: 28px; font-weight: 700; color: #000; margin: 0%; text-align: right;">Bus Ticket</h2>
                                       </div>
                                           <hr style="border-top: 2px solid #000;">
                                           <div style="margin-top: 20px;">
                                             <p style="font-size: 18px; margin-bottom: 10px;"><strong>Dear ${user.fullName},</strong></p>
                                             <p style="font-size: 16px; margin-bottom: 20px;">Your booking for departure on ${date} has been confirmed.</p>
                                             <table style="width: 100%; border-collapse: collapse;">
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Booking ID</th>
                                                 <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${newBookingId}</td>
                                               </tr>
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Trip Number</th>
                                                 <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${trip.tripNumber}</td>
                                               </tr>
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Bus Number</th>
                                                 <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${trip.bus_no}</td>
                                               </tr>
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Driver Name</th>
                                                 <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${Driver.driverName}</td>
                                               </tr>
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Driver Contact</th>
                                                 <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${Driver.driverContact}</td>
                                               </tr>
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Trip Starting Time</th>
                                                 <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${trip.startingTime}</td>
                                               </tr>
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px; border-bottom: 2px solid #000;">Your Source</th>
                                                 <td style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">${source}</td>
                                               </tr>
                                               <tr>
                                                 <th style="padding: 10px; text-align: left; font-size: 18px;"><strong>Your Destination</strong></th>
                                                 <td style="padding: 10px; font-size: 18px;">${destination}</td>
                                               </tr>
                                             </table>
                                             <!-- Passenger Details Section -->
                                             <div style="margin-top: 20px;">
                                               <h3 style="font-size: 24px; font-weight: 700; color: #000; margin-bottom: 10px;">Passenger Details</h3>
                                               <table style="width: 100%; border-collapse: collapse; text-align: center;">
                                                 <tr>
                                                   <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Passenger Name</th>
                                                   <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Age</th>
                                                   <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Gender</th>
                                                   <th style="padding: 10px; font-size: 18px; border-bottom: 2px solid #000;">Seat Number</th>
                                                 </tr>
                                                 ${passengerDetails}
                                               </table>
                                             </div>
                                           </div>
                                           <!-- Footer -->
                                           
                                         </div>
                                       </main>
                                       
                                           `;
        // Generate the QR CODE and send the booking confirmation email
        const qrCodeData = `http://192.168.1.41:4000/${newBookingId}`;
        const qrCodeImage = "ticket-QRCODE.png";
        await qrcode.toFile(qrCodeImage, qrCodeData);

        await sendBookingEmail(
          email,
          "Your Booking has been confirmed",
          emailContent
        );

        res.status(200).json({
          success: true,
          message: "Booking",
          status: mtnResponse.status,
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "error while make payment",
          error_message: error.message,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "server error",
      error_message: error.message,
    });
  }
};

// Function to calculate age group
function calculateAgeGroup(age) {
  if (age > 0 && age <= 2) {
    return "baby";
  } else if (age > 2 && age <= 21) {
    return "children";
  } else {
    return "adult";
  }
}


cron.schedule('0 0 * * *', async () => {
  try {
      const today = moment().startOf('day'); // Get today's date without time
      const fiveDaysAgo = today.clone().subtract(5, 'days'); // Calculate the date 5 days ago

      // Find bookings that are less than today's date and older than 5 days
      const bookingsToDelete = await BookingModel.find({
          date: { $lt: today.toDate(), $gte: fiveDaysAgo.toDate() }
      });

      // Delete the bookings
      await BookingModel.deleteMany({
          _id: { $in: bookingsToDelete.map(booking => booking._id) }
      });

     
  } catch (error) {
      console.error('Error deleting expired bookings:', error);
  }
});



// Api for cancle tickit
const cancelTicket = async (req, res) => {
  try {
    const { email, bookingId } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, missingEmail: "Missing Email" });
    }

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, missingBookingId: "Missing bookingId" });
    }

    const booking = await BookingModel.findOne({ bookingId });

    if (!booking) {
      return res
        .status(404)
        .json({
          success: false,
          BookingNotFound: "Booking not found with the given ID",
        });
    }

    // Fetch the user associated with the booking
    const user = await UserModel.findById(booking.userId);
    const userName = user.fullName;

    // check if the provided email matches the user email
    if (user.email !== email) {
      return res.status(400).json({
        success: false,
        unAuthMessage:
          "Unauthorized: You are not allowed to cancel this booking with these email",
      });
    }

    // Check if the booking status allows cancellation
    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({
          success: false,
          alreadyCancelledMessage: "Booking already cancelled",
        });
    }

    // Get the trip details
    const trip = await TripModel.findById(booking.tripId);

    if (!trip) {
      return res
        .status(400)
        .json({ success: false, tripNotFound: "Trip not found" });
    }

    const tripNumber = trip.tripNumber;

    // calculate the refund amount and cancellation type based on the cancellation policy
    const cancellationDate = new Date(booking.date);
    const currentDate = new Date();
    let cancellationType = "";

    const dayBeforeTrip = Math.ceil(
      (cancellationDate - currentDate) / (1000 * 60 * 60 * 24)
    );

   

    if (dayBeforeTrip >= 5) {
      cancellationType = "flexible";
    } else if (dayBeforeTrip >= 3) {
      cancellationType = "moderate";
    } else if (dayBeforeTrip < 3) {
      cancellationType = "strict";
    }

    let refundAmount = 0;

    if (cancellationType === "flexible") {
      refundAmount = booking.totalFare;
    } else if (cancellationType === "moderate") {
      refundAmount = booking.totalFare * 0.5;
    } else if (cancellationType === "strict") {
      refundAmount = booking.totalFare * 0.0001;
    }

    // Update the available seats and booked seats on the bus
    const { selectedSeatNumbers } = booking;

    for (const seat of selectedSeatNumbers) {
      const index = trip.booked_seat.indexOf(seat);

      if (index !== -1) {
        trip.booked_seat.splice(index, 1);
        trip.Available_seat.push(seat);
      }
    }

    // Set the booking status to 'cancelled'
    booking.status = "cancelled";

    // Find the transaction associated with the booking
    const transaction = await TransactionModel.findOne({
      bookingId: booking.bookingId,
    });

    if (transaction) {
      // Check if the transaction has a chargeId
      const chargeId = transaction.chargeId;

      if (chargeId) {
        if (transaction.payment_key === 1) {
          // Refund process for Stripe
          const stripeRefundProcessingDays =
            Math.floor(Math.random() * (10 - 5 + 1)) + 5;
          const stripeRefundProcessingDate = new Date();
          stripeRefundProcessingDate.setDate(
            stripeRefundProcessingDate.getDate() + stripeRefundProcessingDays
          );

          try {
            const stripeRefund = await stripe.refunds.create({
              charge: chargeId,
              amount: Math.floor(refundAmount * 100),
            });

            if (stripeRefund.status === "succeeded") {
              transaction.payment_status = "cancelled";
              transaction.amount = refundAmount;
              transaction.refundProcessingDate = stripeRefundProcessingDate;
              await transaction.save();
            } else {
              return res.status(400).json({
                success: false,
                refundFailedMessage: "Stripe Refund failed",
              });
            }
          } catch (stripeError) {
            console.error("Stripe Refund Error:", stripeError);
            return res.status(500).json({
              success: false,
              errorMessage: "Stripe Internal server error",
              error_message: stripeError.message,
              error_details: stripeError,
            });
          }
        } else if (transaction.payment_key === 2) {
          // Refund process for MTN MoMo (Replace this with actual MTN MoMo SDK calls)
          const mtnMomoRefundProcessingDays =
            Math.floor(Math.random() * (10 - 5 + 1)) + 5;
          const mtnMomoRefundProcessingDate = new Date();
          mtnMomoRefundProcessingDate.setDate(
            mtnMomoRefundProcessingDate.getDate() + mtnMomoRefundProcessingDays
          );

          try {
            const response = await axios.post(
              "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser",
              {
                transactionId: transaction.chargeId,
                amount: refundAmount,
                referenceId: transaction.xReferenceId,
                apiKey: transaction.mtnApiKey,
                // subscriptionKey : "858dac789fa44355a9d4d2e26c9b400a"
              }
            );

            if (response.data.status === "succeeded") {
              transaction.payment_status = "cancelled";
              transaction.amount = refundAmount;
              transaction.refundProcessingDate = mtnMomoRefundProcessingDate;
            } else {
              return res.status(400).json({
                success: false,
                refundFailedMessage: "MTN MoMo Refund failed",
              });
            }
          } catch (mtnMomoError) {
            console.error("Error making refund request:", mtnMomoError.message);

            return res.status(500).json({
              success: false,
              errorMessage: "MTN MoMo Refund Error",
              error_message: mtnMomoError.message,
              error_details: mtnMomoError,
            });
          }
        }
      }
    }

    const newNotification = new NotificationDetail({
      userId: booking.userId,
      message: `congratulation ..!! your booking : ${bookingId} has been cancelled  `,
      date: new Date(),
      status: "cancelled",
      bookingId: bookingId,
      tripId: booking.tripId,
      notification_status: 0,
    });
    await newNotification.save();

    // notification for admin
    const newAdminNotification = new AdminNotificationDetail({
      userId: booking.userId,
      message: ` cancel booking request sent by the user : ${userName} in a trip : ${tripNumber} with bookingId : ${bookingId} `,
      date: new Date(),
      bookingId: bookingId,
      tripId: booking.tripId,
    });
    await newAdminNotification.save();

    await booking.save();
    await trip.save();

    // Send a cancellation email to the user
    const emailContent = `Dear ${user.fullName},\nYour booking with Booking ID ${booking.bookingId} has been canceled.\n\n
                                                                      Refund Amount: $${refundAmount}\n\nYour amount will refund within 5 to 10 working days.\n\nThank you for using our service.`;
    await sendCancelEmail(
      user.email,
      "Ticket Cancellation Confirmation",
      emailContent
    );

    res.status(200).json({
      success: true,
      SuccessMessage:
        "Ticket cancellation successfully  ,  Confirmation sent to user email.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        ServerErrorMessage: "server error",
        error: error.message,
        error_details: error,
      });
  }
};

// Api for get tickits booked by a user

const userTickets = async (req, res) => {
  try {
    const userId = req.params.userId;
    const status = req.query.status;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID" });
    }

    let tickets;

    if (status === "confirmed") {
      tickets = await BookingModel.find({ userId, status: "confirmed" });
    } else if (status === "pending" || status === "cancelled") {
      tickets = await BookingModel.find({
        userId,
        status: { $in: ["pending", "cancelled"] },
      });
    } else if (!status) {
      // If status is not provided, fetch all tickets without filtering by status
      tickets = await BookingModel.find({ userId });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Status Value" });
    }

    res.status(200).json({ success: true, message: "User Tickets", tickets });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error finding tickets",
        error: error.message,
      });
  }
};

// APi for change trip Date

const getUpcomingTrip_for_DateChange = async (req, res) => {
  try {
    const sourceStop = req.query.sourceStop;
    const destinationStop = req.query.destinationStop;

    // Calculate the date range for the next 7 days
    const today = new Date();

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Find trips that fall within the calculated date range
    const trips = await TripModel.find({
      startingDate: { $gte: today, $lte: nextWeek },
      status: "scheduled",
    });

    if (!trips || trips.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No upcoming trips found ",
      });
    }

    // Filter trips to include only those with matching source and destination stops
    const matchingTrips = [];

    for (const trip of trips) {
      const routeNumber = trip.routeNumber;
      // Find the route with the same routeNumber
      const route = await BusRoute.findOne({ routeNumber });

      if (!route) {
        continue;
      }

      const sourceIndex = route.stops.findIndex(
        (stop) => stop.stopName === sourceStop
      );
      const destinationIndex = route.stops.findIndex(
        (stop) => stop.stopName === destinationStop
      );

      if (
        sourceIndex !== -1 &&
        destinationIndex !== -1 &&
        sourceIndex < destinationIndex
      ) {
        const stops =
          sourceIndex + 1 < destinationIndex
            ? route.stops.slice(sourceIndex + 1, destinationIndex)
            : [];

        matchingTrips.push({
          trip,
        });
      }
    }

    if (matchingTrips.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No matching trips found for the route",
      });
    }

    res.status(200).json({
      success: true,
      message: "upcoming trips for the same route ",
      trips: matchingTrips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while fetching the data",
    });
  }
};

// change Trip

const changeTrip = async (req, res) => {
  try {
    const { bookingId, newTripId } = req.body;

    // Validate required fields
    const requiredFields = ["bookingId", "newTripId"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({
            error: `Missing ${field.replace("_", " ")} field`,
            success: false,
          });
      }
    }

    // Find the booking by bookingId
    const booking = await BookingModel.findOne({ bookingId });
    const userId = booking.userId;
    const user = await UserModel.findOne({ _id: userId });
    const userName = user.fullName;
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    if (booking) {
      // Check if the associated trip is completed
      //   const bookingInHistory = await BookingModel.findOne({ bookingId : bookingId });
      const associatedTrip = await TripModel.findById(booking.tripId);

      if (associatedTrip && associatedTrip.status === "completed") {
        return res
          .status(400)
          .json({
            success: false,
            message: "You cannot change the trip for previous booking Id.",
          });
      } else {
        if (booking.tripUpdated) {
          return res
            .status(400)
            .json({ success: false, message: "Trip already updated once" });
        }

        const oldTripId = booking.tripId;

        // Find the old and new trips based on tripIds
        const oldTrip = await TripModel.findById(oldTripId);
        const oldTripNumber = oldTrip.tripNumber;

        if (!oldTrip) {
          return res
            .status(404)
            .json({ success: false, message: "Old Trip not found" });
        }

        const newTrip = await TripModel.findById(newTripId);
        const newTripNumber = newTrip.tripNumber;

        if (!newTrip) {
          return res
            .status(404)
            .json({ success: false, message: "New trip not found" });
        }

        if (
          !Array.isArray(booking.selectedSeatNumbers) ||
          booking.selectedSeatNumbers.length !== booking.passengers.length
        ) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid selected seat number" });
        }

        // Check if oldTrip and oldTrip.booked_seat are defined and are arrays
        if (!oldTrip || !Array.isArray(oldTrip.booked_seat)) {
          return res.status(400).json({
            success: false,
            message: "Invalid old trip data",
          });
        }

        // Transfer the selected seats from the old trip to the new trip's booked_seat and vice versa
        for (const seat of booking.selectedSeatNumbers) {
          const oldSeatIndex = oldTrip.booked_seat.indexOf(seat);
          const newSeatIndex = newTrip.Available_seat.indexOf(seat);

          if (oldSeatIndex !== -1) {
            oldTrip.booked_seat.splice(oldSeatIndex, 1);
            oldTrip.Available_seat.push(seat);
          }

          if (newSeatIndex !== -1) {
            newTrip.Available_seat.splice(newSeatIndex, 1);
            newTrip.booked_seat.push(seat);
          }
        }

        // Check if the same selectedSeatNumbers of the new trip are already booked in BookingModel
        const existingBooking = await BookingModel.findOne({
          tripId: newTripId,
          selectedSeatNumbers: { $in: booking.selectedSeatNumbers },
        });

        if (existingBooking) {
          // Assign different seat numbers to the user on the same bookingId
          const availableSeatsInNewTrip = newTrip.Available_seat;
          const newSelectedSeatNumbers = [];

          for (const seat of booking.selectedSeatNumbers) {
            if (availableSeatsInNewTrip.includes(seat)) {
              newSelectedSeatNumbers.push(seat);
              availableSeatsInNewTrip.splice(
                availableSeatsInNewTrip.indexOf(seat),
                1
              );
            } else {
              // Find and assign a different seat
              const differentSeat = availableSeatsInNewTrip.shift();
              newSelectedSeatNumbers.push(differentSeat);
            }
          }

          // Update the selectedSeatNumbers and passengers of the existing booking
          existingBooking.selectedSeatNumbers = newSelectedSeatNumbers;
          // Update passengers accordingly
          for (let i = 0; i < booking.passengers.length; i++) {
            existingBooking.passengers[i].seat = newSelectedSeatNumbers[i];
          }

          // Save changes to the existing booking
          await existingBooking.save();
        }

        // Check if there are available seats in the new trip
        if (newTrip.Available_seat.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "No available seats in the new trip. Please select another trip.",
          });
        }

        // Update the booking's tripId to the newTripId
        booking.tripId = newTripId;

        booking.date = newTrip.startingDate;

        // Mark the trip as updated
        booking.tripUpdated = true;

        // Save changes to the booking, oldTrip, and newTrip
        await Promise.all([booking.save(), oldTrip.save(), newTrip.save()]);
        // notification for admin
        const newAdminNotification = new AdminNotificationDetail({
          userId: booking.userId,
          message: `${userName} changed the trip from tripNumber  : ${oldTripNumber} to  tripNumber : ${newTripNumber} with bookingId : ${bookingId} `,
          bookingId,
          date: new Date(),
        });
        await newAdminNotification.save();

        return res.status(200).json({
          success: true,
          message: "Trip changed successfully",
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "There is an error",
    });
  }
};

/* Booking Manage */
//Api for get all Bookings

const allBookings = async (req, res) => {
  try {
    const { status, dateRange } = req.query;

    let bookings = [];
    let dateFilter = {};

    if (dateRange) {
      const startDate = new Date();

      switch (dateRange.toLowerCase()) {
        case "daily":
          dateFilter = { createdAt: { $gte: startDate } };
          break;
        case "weekly":
          const weeklyStartDate = new Date(startDate);
          weeklyStartDate.setDate(startDate.getDate() - 7);
          dateFilter = {
            createdAt: { $gte: weeklyStartDate, $lte: startDate },
          };
          break;
        case "monthly":
          const monthlyStartDate = new Date(startDate);
          monthlyStartDate.setMonth(startDate.getMonth() - 30);
          dateFilter = {
            createdAt: { $gte: monthlyStartDate, $lte: startDate },
          };
          break;
        default:
          return res
            .status(400)
            .json({ success: false, error: "Invalid date range value" });
      }
    }

    if (status === "confirmed") {
      bookings = await BookingModel.find({
        status: "confirmed",
        ...dateFilter,
      });
    } else if (status === "pending" || status === "cancelled") {
      bookings = await BookingModel.find({ status, ...dateFilter });
    } else if (!status && !dateRange) {
      // If neither status nor dateRange is provided, retrieve all bookings
      bookings = await BookingModel.find();
    } else if (!status && dateRange) {
      // If only dateRange is provided, retrieve bookings based on the date range
      bookings = await BookingModel.find(dateFilter);
    } else {
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid combination of status and dateRange",
        });
    }

    const confirmBookingLength = bookings.filter(
      (booking) => booking.status === "confirmed"
    ).length;
    const cancleBookingLength = bookings.filter((booking) =>
      ["pending", "cancelled"].includes(booking.status)
    ).length;
    const bookingLength = bookings.length;

    res.status(200).json({
      success: true,
      message: "All Bookings",
      All_Bookings: bookings,
      totalBooking: bookingLength,
      confirmBooking: confirmBookingLength,
      cancleBooking: cancleBookingLength,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "There is an error finding bookings" });
  }
};

// Api for GET Bookings for a particular date and status

const countBookings = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Both start and end dates are required",
        });
    }

    let query = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    if (status === "confirmed") {
      query.status = "confirmed";
    } else if (status === "pending" || status === "cancelled") {
      query.status = { $in: ["pending", "cancelled"] };
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const bookings = await BookingModel.find(query);

    const count = bookings.length;

    res
      .status(200)
      .json({
        success: true,
        message: `Count of ${status} bookings for date range ${startDate} to ${endDate}`,
        count,
        Bookings: bookings,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while retrieving bookings",
      });
  }
};

// API for TrackBus

// APi to change particular trip's stop status
const change_trips_stop_status = async (req, res) => {
  try {
    const { tripId, stopId } = req.params;

    // check for trip
    const trip = await TripModel.findOne({ _id: tripId, status: "scheduled" });
    if (!trip) {
      return res.status(400).json({
        success: false,
        TripExistanceMessage: "trip not found",
      });
    }
    // find the stop with in stops array by stopId
    const stopToUpdate = trip.stops.find(
      (stop) => stop._id.toString() === stopId
    );

    if (!stopToUpdate) {
      return res
        .status(400)
        .json({
          success: false ,
          stopExistanceMessage: "stop not found in trip",
        });
    }
    stopToUpdate.stop_status = !stopToUpdate.stop_status;
    const updateTrip = await trip.save();

    return res.status(200).json({
      success: true,
      SuccessMessage: "stop status update successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      ServerErrorMessage: "server error",
    });
  }
};

// APi to get all stops in trip
const getTripStops = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    // check for event
    const trip = await TripModel.findOne({ _id: tripId });
    if (!trip) {
      return res.status(400).json({
        success: false,
        TripExistanceMessage: "trip not found",
      });
    }

    const tripStops = trip.stops;
    return res.status(200).json({
      success: true,
      SuccessMessage: "trip Stops ",
      tripStops: tripStops,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      ServerErrorMessage: "there is an server error",
    });
  }
};

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
      paymentStatus = req.query.payment_status.toLowerCase();
    }

    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (paymentStatus) {
      if (paymentStatus === "success") {
        // If payment_status is 'success', include both 'SUCCESSFUL' and 'succeeded' payment statuses
        query.payment_status = { $in: ["SUCCESSFUL", "succeeded"] };
      } else {
        // If payment_status is provided but not 'success', use the provided value directly
        query.payment_status = paymentStatus;
      }
    }

    const transactions = await TransactionModel.find(query);
    const transactionLength = transactions.length;

    res
      .status(200)
      .json({
        success: true,
        message: "All Transactions",
        transactions,
        transactionLength,
      });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

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
// APi for get all users
const allUsers = async (req, res) => {
  try {
    const users = await UserModel.find();

    res
      .status(200)
      .json({ success: true, message: " all users : ", all_users: users });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Error while finding the users" });
  }
};

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
    });

    if (notifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "There are no notifications for the user yet",
      });
    } else {
      // Update notification status
      await NotificationDetail.updateMany(
        { userId, notification_status: 0 },
        { $set: { notification_status: 1 } }
      );

      // Fetch updated notifications
      const updatedNotifications = await NotificationDetail.find({
        userId,
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "User notifications",
        notification_details: updatedNotifications,
      });
    }
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
    });

    // Separate notifications based on notification_status
    const unseenNotifications_Count = notifications.filter(
      (notification) => notification.notification_status === 0
    );

    // Sort notifications by createdAt
    const sortedUnseenNotifications_Count = unseenNotifications_Count.sort(
      (a, b) => b.createdAt - a.createdAt
    );

    if (notifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "There are no notifications for the user yet",
      });
    } else {
      return res.status(200).json({
        success: true,
        SuccessMessage: "notification count",
        unseenNotification: sortedUnseenNotifications_Count,
        unseenNotifications_Count: sortedUnseenNotifications_Count.length,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      ServerErrorMessage: "server error",
    });
  }
};

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

// APi for get booking trip
const getBookingTrip = async (req, res) => {
  try {
    // Get unique tripIds from BookingModel
    const uniqueTripIds = await BookingModel.distinct("tripId");

    // Fetch tripNumber for each tripId from tripModel
    const tripsWithNumbers = await Promise.all(
      uniqueTripIds.map(async (tripId) => {
        const trip = await TripModel.findOne({ _id: tripId });
        return { tripId, tripNumber: trip ? trip.tripNumber : null };
      })
    );

    // Create formatted response
    const formattedTrips = tripsWithNumbers.map(({ tripId, tripNumber }) => {
      return { tripNumber, tripId };
    });

    return res.status(200).json({
      success: true,
      message: "All trips in Booking with corresponding tripNumbers",
      trips: formattedTrips,
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

// cancle trip
const cancelTrip = async (req, res) => {
  try {
    const tripId = req.params.tripId;

    // Check for trip
    const trip = await TripModel.findOne({ _id: tripId });

    if (!trip) {
      return res.status(400).json({
        success: false,
        TripExistanceMessage: "Trip not found in TripModel",
      });
    }

    // Check the same trip in BookingModel
    const bookedTrip = await BookingModel.find({ tripId: tripId });

    // if (!bookedTrip || bookedTrip.length === 0) {
    //     return res.status(400).json({
    //         success: false,
    //         bookedTripExistance: 'Trip not found in BookingModel'
    //     });
    // }

    const userIds = bookedTrip.map((booking) => booking.userId);

    // Access user names by userIds
    const userNames = await UserModel.find({
      _id: { $in: userIds },
    }).distinct("fullName");

    // Fetch all booking IDs associated with the trip
    const bookingIds = await BookingModel.find({ tripId: tripId }).distinct(
      "bookingId"
    );

    if (bookingIds.length > 0) {
      for (const bookingId of bookingIds) {
        try {
          // Update the booking status to 'cancelled' directly
          await BookingModel.updateMany(
            { bookingId: bookingId },
            { $set: { payment_status: "cancelled" } }
          );

          // Find the transaction associated with the booking
          const transaction = await TransactionModel.find({
            bookingId: bookingId,
          });

          if (transaction) {
            // Check if the transaction has a chargeId
            let chargeId = transaction.chargeId;

            if (chargeId) {
              // Calculate refund processing date between 2 to 5 working days
              const refundProcessingDays =
                Math.floor(Math.random() * (5 - 2 + 1)) + 2;
              const refundProcessingDate = new Date();
              refundProcessingDate.setDate(
                refundProcessingDate.getDate() + refundProcessingDays
              );

              // Calculate refund amount (80% of the original amount)
              const refundAmount = transaction.amount * 0.8;

              // Refund the payment using Stripe
              const refund = await stripe.refunds.create({
                charge: chargeId,
                amount: Math.floor(refundAmount * 100),
              });

              if (refund.status === "succeeded") {
                // Update transaction details
                transaction.payment_status = "cancelled";
                transaction.amount = refundAmount;
                transaction.refundProcessingDate = refundProcessingDate;

                await transaction.save();
              } else {
                return res.status(400).json({
                  success: false,
                  message: "Refund failed",
                });
              }
            }
          }
        } catch (error) {
          console.error("Error during booking processing:", error);
        }
      }
    }

    // Send cancellation emails to all trip users
    await Promise.all(
      userIds.map(async (userId, index) => {
        const userEmail = await UserModel.findById(userId).select("email");
        console.log("userEmail", userEmail);
        const emailContent = `Dear ${userNames[index]},\n
                                                                  *************************************************
                                                                  Your booking on trip: ${trip.tripNumber} has been cancelled\n
                                                                  Due to some technical issues,\n
                                                                  your  amount will be refunded within 2 to 5 working days.\n
                                                                  ----------------------------------------------------
                                                                  Thank you for using our service!\n
                                                                  ***************************************************
                                                              `;

        // Replace the following line with your actual email sending function
        await CancelTripEmail(
          userEmail,
          "Trip Cancellation Notification",
          emailContent
        );
      })
    );

    // Update trip status to "cancelled" in TripModel
    trip.status = "cancelled";
    await trip.save();

    return res.status(200).json({
      success: true,
      SuccessMessage:
        "Trip cancellation emails sent successfully to all trip users",
    });
  } catch (error) {
    console.error("Error during trip cancellation:", error);
    return res.status(500).json({
      success: false,
      ServerErrorMessage: "Server Error",
    });
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

    // Handle file upload if a file is present in the request
    if (req.file) {
      if (admin.profileImage) {
        // If the admin already has a profileImage, delete the old file if it exists
        const oldFilePath = `path_to_profile_images/${admin.profileImage}`;
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) {
              console.error("Error deleting old file:", err);
            }
          });
        }
        // Update the profileImage with the new one
        admin.profileImage = req.file.filename;
      } else {
        // If it doesn't exist, simply set it to the new file
        admin.profileImage = req.file.filename;
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

// API for get bookings by date
const getBookings_By_Date = async (req, res) => {
  try {
    const { key } = req.query;
    let dateFilter = {};
    const startDate = new Date();

    switch (key) {
      case "1": // Monthly
        const monthlyStartDate = new Date(startDate);
        monthlyStartDate.setMonth(startDate.getMonth() - 1); // subtract 1 month
        dateFilter = { createdAt: { $gte: monthlyStartDate, $lte: startDate } };
        break;
      case "2": // Weekly
        const weeklyStartDate = new Date(startDate);
        weeklyStartDate.setDate(startDate.getDate() - 7); // subtract 7 days
        dateFilter = { createdAt: { $gte: weeklyStartDate, $lte: startDate } };
        break;
      case "3": // Daily
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        dateFilter = { createdAt: { $gte: today, $lt: new Date() } };
        break;
      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid key value" });
    }

    const bookings = await BookingModel.find(dateFilter);

    // Initialize counters
    let cancelBookingCount = 0;
    let successBookingCount = 0;

    // Group bookings by Date
    const BookingsByDate = {};

    bookings.forEach((booking) => {
      const bookingDate = new Date(booking.createdAt)
        .toISOString()
        .split("T")[0];

      if (!BookingsByDate[bookingDate]) {
        BookingsByDate[bookingDate] = {
          cancelBooking: 0,
          successBooking: 0,
          totalBooking: 0,
        };
      }

      // Categorize bookings
      if (booking.status === "cancelled") {
        cancelBookingCount++;
        BookingsByDate[bookingDate].cancelBooking++;
      } else if (booking.status === "confirmed") {
        successBookingCount++;
        BookingsByDate[bookingDate].successBooking++;
      }

      BookingsByDate[bookingDate].totalBooking++;
    });

    return res.status(200).json({
      success: true,
      SuccessMessage: `Booking for key: ${key}`,
      BookingCounts: {
        cancelBooking: cancelBookingCount,
        successBooking: successBookingCount,
        totalBooking: bookings.length,
      },
      BookingsByDate,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      ServerErrorMessage: "server error",
    });
  }
};

// APi for get total amount in transaction table
const totalTransactionAmount = async (req, res) => {
  try {
    // check for all transaction amount
    const query = {};
    const transactions = await TransactionModel.find(query);

    const totalAmount = transactions.reduce((total, transaction) => {
      return total + transaction.amount;
    }, 0);
    return res.status(200).json({
      success: true,
      SuccessMessage: "total Amount",
      totalAmount: totalAmount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ServerErrorMessage: "server Error",
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

// APi for get particular Booking By tripNumber from BookingModel
const getbooking_by_tripNumber = async (req, res) => {
  try {
    const tripNumber = req.body.tripNumber;
    // check for tripNumber  required
    if (!tripNumber) {
      return res.status(400).json({
        success: false,
        tripNumberRequired: "tripNumber required",
      });
    }

    // check for booking
    const booking = await BookingModel.find({ tripNumber: tripNumber });
    if (!booking) {
      return res.status(400).json({
        success: false,
        transactionExistanceMessage: `booking with the tripNumber : ${tripNumber} not exist`,
      });
    } else {
      return res.status(200).json({
        success: true,
        SuccessMessage: `booking with the tripNumber : ${tripNumber} `,
        booking_details: booking,
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


// Api for add Halt on particular stop in a trip

   const add_Halt_on_stop = async ( req ,res)=>{
    try {
                 const tripId = req.params.tripId
              const { stop_halt , stopName } = req.body
          // check for tripId
        if(!tripId)
        {
          return res.status(400).json({
                  success : false ,
                  tripId_message : 'trip Id required'
          })
        }

        // check for stop_halt and stopName

        if(!stop_halt)
        {
          return res.status(400).json({
                 success : false ,
                 stop_halt_message : 'stop_halt required'
          })
        }
        if(!stopName)
        {
          return res.status(400).json({
                 success : false ,
                 stopName_message : 'stopName required'
          })
        }

            // check for trip
            const trip = await TripModel.findOne({ _id : tripId })
            if(!trip)
            {
              return res.status(400).json({
                      success : false ,
                      trip_message : 'trip not found'
              })
            }
                            // Find the stop in the trip by stopName
                const stop = trip.stops.find(stop => stop.stopName === stopName);

                if (!stop) {
                  return res.status(400).json({
                     success : false ,                 
                    stop_message: 'Stop not found in the trip' });
                }
                const timeParts = stop_halt.split(",");

                if (timeParts.length !== 2) {
                  return res
                    .status(400)
                    .json({
                      success: false,
                      invalid_message : `Invalid stop_halt format. Use 'X Hour, X Minute' format.`,
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
                      invalid_message: `Invalid stop_halt format. Use 'X Hour, X Minute' format.`,
                    });
                }
            
                const hours = parseInt(hoursMatch[1]);
                const minutes = parseInt(minutesMatch[1]);
            
                // Calculate the total time in minutes
                const totalMinutes = hours * 60 + minutes;

                // Update the stop with the halt information
                stop.stop_halt = `${hours} Hour, ${minutes} Minute`

                // Save the changes to the trip
                await trip.save();

                res.json({ success: true, message: 'Halt added to stop successfully' });


    } catch (error) {
      return res.status(500).json({
              success : false ,
              message : 'server error',
              error_message : error.message
      })
    }
   }


  
         // Api for active Inactive user

        const active_Inactive_user = async ( req ,res)=>{
          try {
                 const userId = req.params.userId
              // check for userId
              if(!userId)
              {
                return res.status(400).json({
                   success : false ,
                   userId_message : 'userID required'
                })
              }

              // check for user
            const user = await UserModel.findOne({
                 _id : userId
        
            })

             // toggle the user status
        
             const currentStatus = user.user_status
             const newStatus = 1 - currentStatus
             user.user_status = newStatus

             let message;
              if (newStatus === 1) {
                  message = 'User inactivated successfully.';
              } else {
                  message = 'User activated successfully.';
              }
              
             await user.save()
             return res.status(200).json({
                 success : true ,
                 message : message
             })
             
          } catch (error) {
               return res.status(500).json({
                    success : false ,
                    message : 'server error'
               })
          
          }
        }
                  
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
  adminLogin,
  googleLogin,
  changePassword,
  addBus,
  updateBus,
  deleteBus,
  allBuses,
  getBus,
  addRoute,
  allroutes,
  editRoute,
  addStop_in_Route,
  editStop_in_Route,
  addStopBeforeStop,
  deleteStop_in_Route,
  deleteRoute,
  searchTrips,
  createStop,
  addStopBeforeStop,
  allStops,
  deleteStop,
  changeProfile,
  addDriver,
  editDriver,
  deleteDriver,
  allDrivers,
  getDriver,
  createTrip,
  allTrips,
  bookTicket,
  cancelTicket,
  userTickets,
  getUpcomingTrip_for_DateChange,
  changeTrip,
  allBookings,
  countBookings,
  viewSeats,
  calculateFareForSelectedSeats,
  All_Transaction,
  import_Buses,
  generate_sampleFile,
  export_Bookings,
  export_Transactions,
  export_Trips,
  export_Users,
  allUsers,
  getNotification,
  getAdminNotification,
  getBookingTrip,
  sendNotification_to_tripUsers,
  sendNotification_to_allUser,
  sendNotifications,
  getAll_Users_Notificatation,
  deleteAllUserNotifications,
  deleteNotifcationById,
  deleteFeedback,
  cancelTrip,
  change_trips_stop_status,
  getTripStops,
  getAdminDetails,
  updateAdmin,
  notificationCount,
  getBookings_By_Date,
  totalTransactionAmount,
  getTransaction_by_bookingId,
  getbooking_by_tripNumber,
  getAllDetailsCount,
  deleteAlltransaction,
  filterTrips,
  getTrip ,
  add_Halt_on_stop,
  active_Inactive_user,
  allStops_ofRoute
};
