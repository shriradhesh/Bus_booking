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
        status: { $ne: 'cancelled' , $ne :  'completed' }
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
        status: { $ne: 'cancelled',  $ne :  'completed' }
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
  
  // cron.schedule('* * * * *', async () => {
  //   try {
  //     const currentDate = new Date();
  //     const oneDayAgo = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  //     // Find trips with end date exactly 24 hours ago and not completed
  //     const expiredTrips = await TripModel.find({
  //       endDate: { $lte: oneDayAgo },
  //       status: { $ne: 'completed' },
  //     });
  
  //     if (expiredTrips.length > 0) {
  //       await TripModel.updateMany(
  //         {
  //           _id: { $in: expiredTrips.map((trip) => trip._id) },
  //         },
  //         {
  //           status: 'completed',
  //         }
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error while updating trip status:', error);
  //   }
  // });
  

     // Api for update trip status 

     const update_tripStatus = async (req, res) => {
      try {
        const tripId = req.params.tripId;
       
        // Check if tripId is provided
        if (!tripId) {
          return res.status(400).json({
            success: false,
            message: 'tripId is required'
          });
        }
    
        // Find the trip by tripId and ensure it's not already completed or cancelled
        const trip = await TripModel.findOne({
          _id : tripId
         
        });
              
        // Check if trip exists
        if (!trip) {
          return res.status(404).json({
            success: false,
            message: 'Trip not found or already completed/cancelled'
          });
        }
    
        // Update status only if current status is 'scheduled'
        if (trip.status === 'scheduled') {
          trip.status = 'completed';
          await trip.save();
    
          return res.status(200).json({
            success: true,
            message: 'Trip status updated to completed'
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Trip status cannot be updated. Current status is not scheduled.'
          });
        }
    
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
        });
      }
    };
    

     // Api for update Trip

     const updateTrip = async (req, res) => {
      try {
        const tripId = req.params.tripId;
        const { status } = req.body;
    
        // Validate tripId
        if (!tripId) {
          return res.status(400).json({
            success: false,
            message: 'Trip Id required',
          });
        }
    
        // Validate status
        if (!status) {
          return res.status(400).json({
            success: false,
            message: 'Status required',
          });
        }
    
        // Fetch the trip
        const trip = await TripModel.findOne({ _id: tripId });
        if (!trip) {
          return res.status(404).json({
            success: false,
            message: 'Trip not found',
          });
        }
    
        // Update the trip status
        trip.status = status;
        await trip.save();
    
        return res.status(200).json({
          success: true,
          message: 'Trip status updated successfully',
         
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
          errorMessage: error.message,
        });
      }
    };
    
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
      let AC_tripCount = 0;
      let NON_AC_tripCount = 0;
      let lux_tripCount = 0;
        
      for (const trip of trips) {
        const sourceIndex = trip.stops.findIndex((stop) => stop.stopName === sourceStop);
        const destinationIndex = trip.stops.findIndex((stop) => stop.stopName === destinationStop);
  
        if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex) {
          const stops = trip.stops.map((stop) => stop.stopName);
        
          const stopsDuration = calculateTotalDuration(trip.stops, sourceIndex, destinationIndex);
          const arrivalTime = ArrivalTime(trip, sourceStop);
          const departureTime = DepartureTime(trip, sourceStop)
          const destinationExpectedTime = DestinationExpectedTime(departureTime, stopsDuration);

           // Count trip types
            if (trip.bus_type === 'AC') {
              AC_tripCount++;
            } else if (trip.bus_type === 'NON_AC' || trip.bus_type === 'Non-AC') {
              NON_AC_tripCount++;
            } else if (trip.bus_type === 'luxury') {
              lux_tripCount++;
            }
                   

          
          matchingTrips.push({           
            trip: trip,
            stopsDuration: stopsDuration,
            ArrivalTime: arrivalTime,
            DepartureTime: departureTime,
            destinationExpectedTime: destinationExpectedTime
            
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
        AC_tripCount: AC_tripCount,
        NON_AC_tripCount: NON_AC_tripCount,
        lux_tripCount: lux_tripCount,
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
  

  // Round trip 

  const RoundTrip = async (req, res) => {
    try {
      const { sourceStop, destinationStop, date, returnDate } = req.body;
  
      // Validate input
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
  
      // Function to find matching trips based on stops and date
      const findTrips = async (fromStop, toStop, tripDate) => {
        const trips = await TripModel.find({
          startingDate: tripDate,
          status: "scheduled"
        });
  
        if (!trips || trips.length === 0) {
          return [];
        }
  
        const matchingTrips = [];
  
        for (const trip of trips) {
          const sourceIndex = trip.stops.findIndex((stop) => stop.stopName === fromStop);
          const destinationIndex = trip.stops.findIndex((stop) => stop.stopName === toStop);
  
          if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex) {
            const stopsDuration = calculateTotalDuration(trip.stops, sourceIndex, destinationIndex);
            const arrivalTime = ArrivalTime(trip, fromStop);
            const departureTime = DepartureTime(trip, fromStop);
            const destinationExpectedTime = DestinationExpectedTime(departureTime, stopsDuration);
  
            matchingTrips.push({
              trip: trip,
              stopsDuration: stopsDuration,
              arrivalTime: arrivalTime,
              departureTime: departureTime,
              destinationExpectedTime : destinationExpectedTime
              
            });
          }
        }
  
        return matchingTrips;
      };
  
      // Find outbound trips
      const outboundTrips = await findTrips(sourceStop, destinationStop, date);
  
      if (outboundTrips.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No matching outbound trips found for the selected stops and date'
        });
      }
  
      // Find return trips if returnDate is provided
      let returnTrips = [];
      if (returnDate) {
        returnTrips = await findTrips(destinationStop, sourceStop, returnDate);
      }
  
      res.status(200).json({
        success: true,
        message: 'Trips for the search criteria',
        outboundTrips: outboundTrips,
        returnTrips: returnTrips
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error while fetching the data',
        error_message: error.message
      });
    }
  };
  
  
  
                                             /*  Calculate Arrival Time and Departure Time */

                                          
                                     
                                     
                                     // function for convert time into 24 hour format

                                     function convertTo24Hour(time) {
                                      const [timePart, modifier] = time.split(' ');
                                      let [hours, minutes] = timePart.split(':');
                                      
                                      hours = parseInt(hours, 10);
                                  
                                      if (modifier === 'PM' && hours !== 12) {
                                          hours += 12;
                                      } else if (modifier === 'AM' && hours === 12) {
                                          hours = 0;
                                      }
                                      
                                      hours = hours < 10 ? '0' + hours : hours;
                                      minutes = minutes < 10 ? '0' + minutes : minutes;
                                  
                                      return `${hours}:${minutes}`;
                                  }

                                           // calculate totalDuration
                                  
                                  const calculateTotalDuration = (stops, sourceIndex, destinationIndex) => {
                                      let totalHours = 0;
                                      let totalMinutes = 0;
                                    
                                      for (let i = sourceIndex; i <= destinationIndex; i++) {
                                          if (i !== sourceIndex) {
                                              const stop = stops[i];
                                              const haltTime = stop.stop_halt || "0 Hour, 0 Minute"; 
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

                                         
                                                    // calculate ArrivalTime
                                  
                                  function ArrivalTime(trip, sourceStop) {
                                    const sourceIndex = trip.stops.findIndex(stop => stop.stopName === sourceStop);
                                    if (sourceIndex === -1) return null;
                                    if (sourceIndex === 0) return `${trip.startingTime}`;
                                
                                    var [startingDate, startingTime] = trip.startingTime.split(', ');
                                    const startingTime24 = convertTo24Hour(startingTime);
                                    let [hours24, minutes24] = startingTime24.split(':').map(Number);
                                
                                    const totalEstimatedTime = calculateTotalDuration(trip.stops, 0, sourceIndex);
                                    let arrivalHours = hours24 + totalEstimatedTime.hours;
                                    let arrivalMinutes = minutes24 + totalEstimatedTime.minutes;
                                
                                    if (arrivalMinutes >= 60) {
                                        arrivalHours += Math.floor(arrivalMinutes / 60);
                                        arrivalMinutes %= 60;
                                    }
                                
                                    arrivalHours = arrivalHours < 10 ? '0' + arrivalHours : arrivalHours;
                                    arrivalMinutes = arrivalMinutes < 10 ? '0' + arrivalMinutes : arrivalMinutes;
                                
                                    let formattedArrivalTime = `${arrivalHours}:${arrivalMinutes}`;

                                                                    // If formattedArrivalTime exceeds 24:00, adjust the date and time
                                    if (arrivalHours >= 24) {
                                      var nextDate = new Date(startingDate);
                                      nextDate.setDate(nextDate.getDate() + 1); // Increment date by 1
                                      startingDate = nextDate.toISOString().split('T')[0]; // Get the next date
                                      arrivalHours -= 24; // Subtract 24 hours
                                      formattedArrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes}`;
                                  }
                                   
                                
                                 
                                
                                    return `${startingDate}, ${formattedArrivalTime}`
                                }
                                                    // calculate Departure Time
                                  
                                  function DepartureTime(trip, sourceStop) {
                                      const sourceIndex = trip.stops.findIndex(stop => stop.stopName === sourceStop);
                                      if (sourceIndex === -1) return null;
                                      if (sourceIndex === 0) return `${trip.startingTime}`;
                                  
                                      var [startingDate, startingTime] = trip.startingTime.split(', ');
                                      const startingTime24 = convertTo24Hour(startingTime);
                                      let [hours24, minutes24] = startingTime24.split(':').map(Number);
                                  
                                      const totalEstimatedTime = calculateTotalDuration(trip.stops, 0, sourceIndex);
                                      let departureHours = hours24 + totalEstimatedTime.hours;
                                      let departureMinutes = minutes24 + totalEstimatedTime.minutes;
                                  
                                      if (departureMinutes >= 60) {
                                          departureHours += Math.floor(departureMinutes / 60);
                                          departureMinutes %= 60;
                                      }
                                  
                                      departureHours = departureHours < 10 ? '0' + departureHours : departureHours;
                                      departureMinutes = departureMinutes < 10 ? '0' + departureMinutes : departureMinutes;
                                  
                                      var formattedDepartureTime = `${departureHours}:${departureMinutes}`;

                                      if (departureHours >= 24) {
                                        var nextDate = new Date(startingDate);
                                        nextDate.setDate(nextDate.getDate() + 1); // Increment date by 1
                                        startingDate = nextDate.toISOString().split('T')[0]; // Get the next date
                                        departureHours -= 24; // Subtract 24 hours
                                        formattedDepartureTime = `${departureHours.toString().padStart(2, '0')}:${departureMinutes}`;
                                    }
                                      return `${startingDate}, ${formattedDepartureTime}`;
                                  }
                                
                                  function convertTo24Hour(time) {
                                    let [timePart, modifier] = time.split(' ');
                                    let [hours, minutes] = timePart.split(':').map(Number);
                                  
                                    if (modifier === 'PM' && hours < 12) {
                                      hours += 12;
                                    }
                                    if (modifier === 'AM' && hours === 12) {
                                      hours = 0;
                                    }
                                  
                                    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
                                  }
                                  
                                  function DestinationExpectedTime(departureTime, stopsDuration) {
                                    var [startingDate, departureFormattedTime] = departureTime.split(', ');
                                    departureFormattedTime = convertTo24Hour(departureFormattedTime);
                                    let [departureHours, departureMinutes] = departureFormattedTime.split(':').map(Number);
                                  
                                    let durationHours = stopsDuration.hours;
                                    let durationMinutes = stopsDuration.minutes;
                                  
                                    let expectedHours = departureHours + durationHours;
                                    let expectedMinutes = departureMinutes + durationMinutes;
                                  
                                    if (expectedMinutes >= 60) {
                                      expectedHours += Math.floor(expectedMinutes / 60);
                                      expectedMinutes %= 60;
                                    }
                                  
                                    // Handle next day scenario
                                    while (expectedHours >= 24) {
                                      var nextDate = new Date(startingDate);
                                      nextDate.setDate(nextDate.getDate() + 1); // Increment date by 1
                                      startingDate = nextDate.toISOString().split('T')[0]; // Get the next date
                                      expectedHours -= 24; // Subtract 24 hours
                                    }
                                  
                                    expectedHours = expectedHours < 10 ? '0' + expectedHours : expectedHours;
                                    expectedMinutes = expectedMinutes < 10 ? '0' + expectedMinutes : expectedMinutes;
                                  
                                    let formattedExpectedTime = `${expectedHours}:${expectedMinutes}`;
                                  
                                    return `${startingDate}, ${formattedExpectedTime}`;
                                  }
                                  
                                  
  
  
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

          const destinationExpectedTime = DestinationExpectedTime(departureTime, stopsDuration);
  
  
          matchingTrips.push({
            trip: trip,
            stopsDuration: stopsDuration,
            ArrivalTime: resultArrivalTime,
            DepartureTime: departureTime,
            destinationExpectedTime : destinationExpectedTime
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
            seatFare = Math.ceil(totalFare * 0.8); // Half fare for children
            break;
          case "teen":
            seatFare = Math.ceil(totalFare)  // full fare for teen
            break;
          case "adult":
            seatFare = Math.ceil(totalFare) // Full fare for adults
            break;
          default:
            seatFare = Math.ceil(totalFare)
        }
            

             if(seatFare < 50 )
              {
                  return res.status(400).json({
                      success : false ,
                      message : 'Seat Fare should be more then 50 Cents'
                  })
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
      var totalFare = fares.reduce(
        (acc, passenger) => acc + passenger.seatFare,
        0
      );

         totalFare = Math.ceil(totalFare)
  
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
    if (age > 0 && age < 2) {
      return "baby";
    } else if (age >= 2 && age < 12) {
      return "children";
    }
    else if (age >= 12 && age < 18) {
      return "teen";
    }
     else {
      return "adult";
    }
  }

  // APi for change trip Date

  const getUpcomingTrip_for_DateChange = async (req, res) => {
    try {
        const sourceStop = req.query.sourceStop;
        const destinationStop = req.query.destinationStop;
        const bookingId = req.body.bookingId;

        // Check for booking
        const booking = await BookingModel.findOne({
            bookingId: bookingId
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Calculate the date range for the next 7 days from the booking date
        const bookingDate = new Date(booking.date);
        
        const nextWeek = new Date(bookingDate);
        nextWeek.setDate(bookingDate.getDate() + 7);
     
        // Find trips that fall within the calculated date range
        const trips = await TripModel.find({
            startingDate: { $gte: bookingDate, $lte: nextWeek },
            status: "scheduled"
        });

        if (!trips || trips.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No upcoming trips found"
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
                    stops
                });
            }
        }

        if (matchingTrips.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No matching trips found for the route"
            });
        }

        res.status(200).json({
            success: true,
            message: "Upcoming trips for the same route",
            trips: matchingTrips
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error_message: error.message
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
          return res.status(400).json({
            error: `Missing ${field.replace("_", " ")} field`,
            success: false,
          });
        }
      }
  
      // Find the booking by bookingId
      const booking = await BookingModel.findOne({ bookingId });
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }

      const tripId = booking.tripId.toString();
     
      
         
         // Check if the tripId is already the newTripId
    if (tripId === newTripId) {
      return res.status(400).json({
        success: false,
        message: "You have already changed the trip to this trip ID. You can't change it again",
      });
    }
  
      const userId = booking.userId;
      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const userName = user.fullName;
  
      
      // Check if the associated trip is completed
      const associatedTrip = await TripModel.findById(booking.tripId);
      if (associatedTrip && associatedTrip.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "You cannot change the trip for a completed booking.",
        });
      }
  
  
      const oldTripId = booking.tripId;
  
      // Find the old and new trips based on tripIds
      const oldTrip = await TripModel.findById(oldTripId);
      if (!oldTrip) {
        return res.status(404).json({ success: false, message: "Old Trip not found" });
      }
      const oldTripNumber = oldTrip.tripNumber;
  
      const newTrip = await TripModel.findById(newTripId);
      if (!newTrip) {
        return res.status(404).json({ success: false, message: "New trip not found" });
      }
      const newTripNumber = newTrip.tripNumber;
  
      // Validate selected seat numbers
      if (
        !Array.isArray(booking.selectedSeatNumbers) ||
        booking.selectedSeatNumbers.length !== booking.passengers.length
      ) {
        return res.status(400).json({ success: false, message: "Invalid selected seat number" });
      }
  
      // Check if oldTrip and oldTrip.booked_seat are defined and are arrays
      if (!Array.isArray(oldTrip.booked_seat)) {
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
          message: "No available seats in the new trip. Please select another trip.",
        });
      }
  
      // Update the booking's tripId to the newTripId
      booking.tripId = newTripId;
      booking.date = newTrip.startingDate;
  
      // Mark the trip as updated
      booking.tripUpdated = true;
  
      // Save changes to the booking, oldTrip, and newTrip
      await Promise.all([booking.save(), oldTrip.save(), newTrip.save()]);
  
      // Notification for admin
      const newAdminNotification = new AdminNotificationDetail({
        userId: booking.userId,
        message: `${userName} changed the trip from tripNumber: ${oldTripNumber} to tripNumber: ${newTripNumber} with bookingId: ${bookingId}`,
        bookingId,
        date: new Date(),
      });
      await newAdminNotification.save();
  
      return res.status(200).json({
        success: true,
        message: "Trip changed successfully",
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "There is an error",
        error_message: error.message
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
          const emailContent = `Dear ${ userNames[index] },\n
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
  


            module.exports = {
                createTrip,
                allTrips,
                getTrip ,
                searchTrips, 
                viewSeats,
                calculateFareForSelectedSeats, 
                filterTrips,  
                getUpcomingTrip_for_DateChange,
                changeTrip,
                change_trips_stop_status,
                 getTripStops,
                 cancelTrip,
                 add_Halt_on_stop,
                 updateTrip ,
                 RoundTrip,
                 update_tripStatus
            }