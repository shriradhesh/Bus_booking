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
const PDFDocument = require('pdfkit');
const { PricingV1VoiceVoiceNumberInboundCallPrice } = require("twilio/lib/rest/pricing/v1/voice/number");
const promo_Code_Model = require('../models/promo_code')
const sendReturnEmail = require('../utils/sendReturnEmail')


                                                      
                                                          /*  Manage Tickit */

                  /* Booking */

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
                                        payment,
                                        payment_key,
                                        mtnResponse,                                      
                                        orangeResponse,
                                        accessToken,
                                        payToken,
                                        mtn_access_token,
                                        promoCode,
                                        return_date , 
                                        return_tripId,
                                        return_SeatNumbers

                                        
                                  
                                      } = req.body;

                                      var  totalFare_in_Euro = req.body.totalFare_in_Euro
                                       
                                  
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

                                                   // check for return trip
                                          var return_trip = await TripModel.findOne({ _id : return_tripId })
                                            
                                  
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


                      //                                 // check the promocode is valid or not
                      //   if (promoCode) {
                      //     const check_promo_code = await promo_Code_Model.findOne({
                      //         promo_code: promoCode
                      //     });

                      //     if (!check_promo_code || new Date() > check_promo_code.end_Date  || new Date() < check_promo_code.start_Date)  {
                      //         return res.status(400).json({
                      //             success: false,
                      //             message: `Applied promo code is  not valid`
                      //         });
                      //     }

                      //          // check if the promo  code usage has exceeded its limit
                      //          const promo_codeUsageCount = await TransactionModel.countDocuments({ promoCode })
                      //          if(promo_codeUsageCount > check_promo_code.limit)
                      //           {
                      //             return res.status(400).json({
                      //               success: false,
                      //               message: `Promo code usage limit has been exceeded`
                      //           });
                      //           }
                      //         if (date < check_promo_code.start_Date || date > check_promo_code.end_Date) {
                      //             return res.status(400).json({
                      //                 success: false,
                      //                 message: `Applied promo code is not valid for the selected date`
                      //             });
                      //         }                 

                      //         const discount = check_promo_code.discount / 100;
                      //         const discount_price = totalFare_in_Euro * discount;
                      //         totalFare_in_Euro = totalFare_in_Euro - discount_price;

                              
                      // }
                                            
                
                                  
                                    
                                      
                                     
                                  
                                      // check for payment key for payment method
                                      // here 1 for stripe
                                      // here 2 for mtn momo
                                      // here 3 for orange Money

                                          
                                      let roundAmount = Math.ceil(totalFare_in_Euro)                                  
                                     
                                    
                                    
                                      if (payment_key === 1) {
                                                                   
                                        try {    
                                                 

                                          const charge = await stripe.charges.create({
                                            amount : roundAmount,
                                            currency: "xaf",
                                            description: "Bus ticket booking",
                                            source: payment,
                                            receipt_email: email,
                                          });                                            



                                                const charge_status = charge.status

                                                if(return_tripId)
                                                  {
                                                         
                                                      // Check if this booking ID has already been paid

                                            const randomNumber = generateRandomNumber(8);
                                            const bookingId = `BKID${randomNumber}`;
                                          
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
                                              chargeId: charge.id ,
                                              amount: roundAmount,
                                              currency: "xaf",
                                              payment_status: charge_status ,
                                              payment_key: payment_key ,
                                              // promoCode : promoCode,
                                              // discount_price : discount_price
                                            });
                                  
                                            await transaction.save();       
                                            
                                            await trip.save();
                                  
                                            // Create a new booking
                                            const booking = new BookingModel({
                                              tripId,
                                              tripNumber : trip.tripNumber,
                                              date : trip.startingDate,
                                              status,
                                              bookingId,
                                              userId,
                                              selectedSeatNumbers,
                                              passengers: passengers.map((passenger, index) => ({
                                                ...passenger,
                                                seatNumber: selectedSeatNumbers[index],
                                                ageGroup: calculateAgeGroup(passenger.age),
                                              })),
                                              totalFare: roundAmount,
                                              source,
                                              destination,
                                              userEmail: email,
                                             
                                            });

                                            await booking.save()

                                               // Create a new booking for return 
                                            const return_booking = new BookingModel({
                                              tripId : return_tripId,
                                              tripNumber : return_trip.tripNumber,
                                              date : return_trip.startingDate,
                                              status,
                                              bookingId,
                                              userId,
                                              return_SeatNumbers,
                                              passengers: passengers.map((passenger, index) => ({
                                                ...passenger,
                                                seatNumber: return_SeatNumbers[index],
                                                ageGroup: calculateAgeGroup(passenger.age),
                                              })),
                                              // totalFare: roundAmount,
                                              source : destination,
                                              destination : source,
                                              userEmail: email,
                                             
                                            });
                                  
                                            await return_booking.save();
                                  
                                            res.status(200).json({
                                              success: true,
                                              message: "Booking",
                                              bookingId : bookingId ,
                                              status : charge.status 
                                            });
                                                  }
                                                  else
                                                  {
                                                  
                                                      // Check if this booking ID has already been paid

                                            const randomNumber = generateRandomNumber(8);
                                            const bookingId = `BKID${randomNumber}`;
                                          
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
                                              chargeId: charge.id ,
                                              amount: roundAmount,
                                              currency: "xaf",
                                              payment_status: charge_status ,
                                              payment_key: payment_key ,
                                              // promoCode : promoCode,
                                              // discount_price : discount_price
                                            });
                                  
                                            await transaction.save();       
                                            
                                            await trip.save();
                                                           

                                            // Create a new booking
                                            const booking = new BookingModel({
                                              tripId,
                                              tripNumber : trip.tripNumber,
                                              date : trip.startingDate,
                                              status,
                                              bookingId,
                                              userId,
                                              selectedSeatNumbers,
                                              passengers: passengers.map((passenger, index) => ({
                                                ...passenger,
                                                seatNumber: selectedSeatNumbers[index],
                                                ageGroup: calculateAgeGroup(passenger.age),
                                              })),
                                              totalFare: roundAmount,
                                              source,
                                              destination,
                                              userEmail: email,
                                             
                                            });

                                                

                                            await booking.save()
                                          

                                            res.status(200).json({
                                              success: true,
                                              message: "Booking",
                                              bookingId : bookingId ,
                                              status : charge.status 
                                            });
                                                  }
                                          
                                          
                                        } catch (error) {
                                          return res.status(400).json({
                                            success: true,
                                            message: "error while make stripe payment",
                                            error_message: error.message,
                                          });
                                        }
                                      }
                                  
                                      if (payment_key === 2) {
                                        try {

                                          if(return_tripId)
                                            {

                                              const randomNumber = generateRandomNumber(8);                                        
                                                                       
                                              const newBookingId = `BKID${randomNumber}`;
                                      
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
                                                paymentRef : mtnResponse.data.paymentStatus.paymentRef,                                     
                                                amount: totalFare_in_Euro,
                                                notify_url :  mtnResponse.data.paymentStatus.notifurl,
                                                currency: mtnResponse.data.paymentStatus.currency,
                                                request_id : mtnResponse.data.paymentStatus.request_id,
                                                payment_status: mtnResponse.data.paymentStatus.status,
                                                payment_key: payment_key,
                                                subscriberMsisdn : mtnResponse.data.paymentStatus.subscriberMsisdn,
                                                mtn_access_token : mtnResponse.data.paymentStatus.payToken,
                                                customer_key : mtnResponse.data.paymentStatus.customer_key,
                                                // promoCode : promoCode,
                                                // discount_price : discount_price
                                              });
                                                     
                                                      
                                              await transaction.save()
                                      
                                              
                                              // Save the updated trip
                                              await trip.save();
                                      
                                              // Create a new booking
                                              const booking = new BookingModel({
                                                tripId,
                                                tripNumber : trip.tripNumber ,
                                                date : trip.startingDate,
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
                                                userEmail: email
                                                
                                              });
                                      
                                              await booking.save();

                                                   // create return booking

                                                  // Create a new booking
                                              const retrun_booking = new BookingModel({
                                                tripId : return_tripId,
                                                tripNumber : return_trip.tripNumber,
                                                date : return_trip.startingDate,
                                                status,
                                                bookingId: newBookingId,
                                                userId,
                                                return_SeatNumbers,
                                                passengers: passengers.map((passenger, index) => ({
                                                  ...passenger,
                                                  seatNumber: return_SeatNumbers[index],
                                                  ageGroup: calculateAgeGroup(passenger.age),
                                                })),
                                                // totalFare: totalFare_in_Euro,
                                                source : destination,
                                                destination : source,
                                                userEmail: email
                                                
                                              });
                                      
                                              await retrun_booking.save();
                                              
                                          res.status(200).json({
                                            success: true,
                                            message: "Booking",
                                            bookingId : newBookingId  
                                            // status: mtnResponse.status,
                                          });

                                            }
                                            else
                                            {
                                              const randomNumber = generateRandomNumber(8);                                        
                                                                       
                                              const newBookingId = `BKID${randomNumber}`;
                                      
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
                                                paymentRef : mtnResponse.data.paymentStatus.paymentRef,                                     
                                                amount: totalFare_in_Euro,
                                                notify_url :  mtnResponse.data.paymentStatus.notifurl,
                                                currency: mtnResponse.data.paymentStatus.currency,
                                                request_id : mtnResponse.data.paymentStatus.request_id,
                                                payment_status: mtnResponse.data.paymentStatus.status,
                                                payment_key: payment_key,
                                                subscriberMsisdn : mtnResponse.data.paymentStatus.subscriberMsisdn,
                                                mtn_access_token : mtnResponse.data.paymentStatus.payToken,
                                                customer_key : mtnResponse.data.paymentStatus.customer_key,
                                                // promoCode : promoCode,
                                                // discount_price : discount_price
                                              });
                                                     
                                                      
                                              await transaction.save()
                                      
                                              
                                              // Save the updated trip
                                              await trip.save();
                                      
                                              // Create a new booking
                                              const booking = new BookingModel({
                                                tripId,
                                                tripNumber : trip.tripNumber,
                                                date : trip.startingDate,
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
                                                userEmail: email
                                                
                                              });
                                      
                                              await booking.save();
                                              
                                          res.status(200).json({
                                            success: true,
                                            message: "Booking",
                                            bookingId : newBookingId  
                                            // status: mtnResponse.status,
                                          });
                                            }
                                                                                          
                                         
                                  
                                        } catch (error) {
                                          return res.status(400).json({
                                            success: false,
                                            message: "error while make mtn payment",
                                            error_message: error.message,
                                          });
                                        }
                                      }
                                      if(payment_key === 3)
                                      { 
                                           
                                         try {      
                                  
                                                if(return_tripId)
                                                  {
                                                    const randomNumber = generateRandomNumber(8);
                                                    const newBookingId = `BKID${randomNumber}`;
                                            
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
                                                      chargeId: orangeResponse.data.txnid,
                                                      subscriberMsisdn : orangeResponse.data.subscriberMsisdn,
                                                      txnmode: orangeResponse.data.txnmode,           
                                                      amount: totalFare_in_Euro,            
                                                      createtime: orangeResponse.data.createtime,
                                                      payment_status: orangeResponse.data.status,
                                                      payment_key: payment_key,
                                                      accessToken : accessToken,
                                                      payToken : payToken,
                                                     //  promoCode : promoCode,
                                                     //  discount_price : discount_price
                                                    });
                                            
                                                    await transaction.save();
                                            
                                                    // Save the updated trip
                                                    await trip.save();
                                            
                                                    // Create a new booking
                                                    const booking = new BookingModel({
                                                      tripId,
                                                      tripNumber : trip.tripNumber,
                                                      date : trip.startingDate,
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
                                                      userEmail: email
                                                     
                                                    });
                                            
                                                      await  booking.save()

                                                      // new booking for return trip

                                                         
                                                    const return_booking = new BookingModel({
                                                      tripId : return_tripId,
                                                      tripNumber : return_trip.tripNumber,
                                                      date : return_trip.startingDate,
                                                      status,
                                                      bookingId: newBookingId,
                                                      userId,
                                                      return_SeatNumbers,
                                                      passengers: passengers.map((passenger, index) => ({
                                                        ...passenger,
                                                        seatNumber: return_SeatNumbers[index],
                                                        ageGroup: calculateAgeGroup(passenger.age),
                                                      })),
                                                      // totalFare: totalFare_in_Euro,
                                                      source : destination,
                                                      destination : source,
                                                      userEmail: email
                                                     
                                                    });
                                            
                                                      await  return_booking.save()
                                             
                                            
                                                    res.status(200).json({
                                                      success: true,
                                                      message: "Booking",
                                                      bookingId : newBookingId  ,
                                                      status: orangeResponse.data.status,
                                                    });      
                                                  }
                                             
                                          
                                          const randomNumber = generateRandomNumber(8);
                                           const newBookingId = `BKID${randomNumber}`;
                                   
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
                                             chargeId: orangeResponse.data.txnid,
                                             subscriberMsisdn : orangeResponse.data.subscriberMsisdn,
                                             txnmode: orangeResponse.data.txnmode,           
                                             amount: totalFare_in_Euro,            
                                             createtime: orangeResponse.data.createtime,
                                             payment_status: orangeResponse.data.status,
                                             payment_key: payment_key,
                                             accessToken : accessToken,
                                             payToken : payToken,
                                            //  promoCode : promoCode,
                                            //  discount_price : discount_price
                                           });
                                   
                                           await transaction.save();
                                   
                                           // Save the updated trip
                                           await trip.save();
                                   
                                           // Create a new booking
                                           const booking = new BookingModel({
                                             tripId,
                                             tripNumber : trip.tripNumber,
                                             date : trip.startingDate,
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
                                             userEmail: email
                                            
                                           });
                                   
                                             await  booking.save()
                                    
                                   
                                           res.status(200).json({
                                             success: true,
                                             message: "Booking",
                                             bookingId : newBookingId  ,
                                             status: orangeResponse.data.status,
                                           });         
                                         
                                         } catch (error) {
                                           return res.status(400).json({
                                             success: false,
                                             message: "error while make orange payment",
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
                                                    // Function to generate a random number
                          function generateRandomNumber(length) {
                            let result = '';
                            const characters = '0123456789';
                            const charactersLength = characters.length;
                        
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * charactersLength));
                            }
                        
                            return result;
                        }
                                  
 // updateBooking 
 const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    const bookings = await BookingModel.find({ bookingId });
    if (bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const transaction = await TransactionModel.findOne({ bookingId });
    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const paymentStatus = transaction.payment_status;
    if (!['succeeded', 'SUCCESSFUL', 'SUCCESSFULL'].includes(paymentStatus)) {
      await Promise.all(bookings.map(async (booking) => {
        booking.status = 'cancelled';     
          await booking.save()
          
      }));

      transaction.payment_status = 'failed';
      await transaction.save()

      return res.status(200).json({
        success: true,
        failedMessage: 'Booking cancelled due to payment failure',
      });
    }

    const trip = await TripModel.findOne({ _id: bookings[0].tripId });
    if (!trip) {
      return res.status(400).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Handle selected and return seats
    const updateSeats = (seatNumbers) => {
      seatNumbers.forEach(seat => {
        const index = trip.Available_seat.indexOf(seat);
        if (index !== -1) {
          trip.Available_seat.splice(index, 1);
          trip.booked_seat.push(seat);
        }
      });
    };

    bookings.forEach(booking => {
      updateSeats(booking.selectedSeatNumbers);
      updateSeats(booking.return_SeatNumbers);
      booking.status = 'confirmed';
    });

    await Promise.all([trip.save(), ...bookings.map(booking => booking.save())]);

    const generateAndSendEmail = async () => {
                              const newNotification = new NotificationDetail({
                                userId: bookings[0].userId,
                                message: `Congratulations! Your booking with ID ${bookingId} has been confirmed.`,
                                date: bookings[0].date,
                                status: "confirmed",
                                bookingId,
                                tripId: bookings[0].tripId,
                                notification_status: 0,
                              });
                              await newNotification.save();

                            const user = await UserModel.findOne({ _id: bookings[0].userId });
                            const newAdminNotification = new AdminNotificationDetail({
                              userId: bookings[0].userId,
                              message: `Congratulations! Booking with ID ${bookingId} has been made by user ${user.fullName} for trip ${trip.tripNumber}.`,
                              date: bookings[0].date,
                              status: "confirmed",
                              bookingId,
                              tripId: bookings[0].tripId,
                            });
                            await newAdminNotification.save();
                                                      
                                                                        
                                    if(bookings.length === 1)
                                    {          
                                      const booking = bookings[0]          
                                      const [user, driver] = await Promise.all([
                                        UserModel.findOne({ _id: booking.userId }),
                                        DriverModel.findOne({ driverId: trip.driverId }),
                                      ]);                                         


                                                        const passengerDetails = booking.passengers.map((passenger, index) => {
                                                          const seatNumber = booking.selectedSeatNumbers[index];
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
                                                        }).join("\n");

                                                        // Common email content
                                                        const emailContent = `<main style="width: 70%; margin: 30px auto; padding: 15px; background-color: #d3d3d3; border: 3px solid #000; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                                      <div style="text-align: center;">
                                                        <h2 style="font-size: 24px; font-family: 'Arial Black', sans-serif; color: #556b2f; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Camer Bus Travels</h2>
                                                        <h3 style="font-size: 18px; font-weight: 700; color: #000; margin: 0;">Book-Ticket</h3>
                                                      </div>
                                                    
                                                      <hr style="border-top: 1px dashed #007bff; margin: 15px 0;">
                                                    
                                                      <div style="margin: 15px 0;">
                                                        <p style="font-size: 14px; margin-bottom: 8px;"><strong>Dear ${user.fullName},</strong></p>
                                                        <p style="font-size: 12px; margin-bottom: 15px;">Your booking for departure on ${booking.date} has been confirmed.</p>
                                                    
                                                        <div style="background-color: #fff; border-radius: 6px; padding: 15px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
                                                          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                                            <div style="flex: 1;">
                                                              <p style="font-size: 14px; margin: 0;"><strong>Booking ID:</strong> ${bookingId}</p>
                                                              <p style="font-size: 14px; margin: 0;"><strong>Trip Number:</strong> ${trip.tripNumber}</p>
                                                              <p style="font-size: 14px; margin: 0;"><strong>Bus Number:</strong> ${trip.bus_no}</p>
                                                              <p style="font-size: 14px; margin: 0;"><strong>Driver Name:</strong> ${driver.driverName}</p>
                                                              <p style="font-size: 14px; margin: 0;"><strong>Driver Contact:</strong> ${driver.driverContact}</p>
                                                              <p style="font-size: 14px; margin: 0;"><strong>Trip Starting Time:</strong> ${trip.startingTime}</p>
                                                              <p style="font-size: 14px; margin: 0;"><strong>Total Amount paid </strong> ${booking.totalFare}</p>
                                                            </div>
                                                            <div style="flex: 1;">
                                                              <p style="font-size: 14px; margin: 0;"><strong>Your Source:</strong> ${booking.source}</p>
                                                              <p style="font-size: 14px; margin: 0;"><strong>Your Destination:</strong> ${booking.destination}</p>
                                                              <!-- Add more ticket details here -->
                                                            </div>
                                                          </div>
                                                    
                                                          <!-- Passenger Details Section -->
                                                          <div>
                                                            <h3 style="font-size: 18px; font-weight: 700; color: #000; margin-bottom: 8px;">Passenger Details</h3>
                                                            <div style="overflow-x: auto;">
                                                              <table style="width: 100%; border-collapse: collapse;">
                                                                <tr style="background-color: #007bff; color: #fff;">
                                                                  <th style="padding: 8px; font-size: 14px;">Passenger Name</th>
                                                                  <th style="padding: 8px; font-size: 14px;">Age</th>
                                                                  <th style="padding: 8px; font-size: 14px;">Gender</th>
                                                                  <th style="padding: 8px; font-size: 14px;">Seat Number</th>
                                                                </tr>
                                                                ${passengerDetails}
                                                              </table>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <!-- Footer -->
                                                    </main>`;

                                                            const htmlContent = `<!DOCTYPE html>
                      <html lang="en">
                      <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Booking Confirmation</title>
                      </head>
                      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5;">
                          <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                              <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px; text-align: center;">Booking Confirmation</h1>

                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">Dear ${user.fullName},</p>

                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">We are delighted to inform you that your booking with <strong> Camer Bus Travels </strong>  has been successfully processed.</p>

                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">If you have any questions or need further assistance, please feel free to contact our customer service team at <a href="tel:+393275469245" style="color: #007bff; text-decoration: none;"> +393275469245 </a> or reply to this email.</p>

                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">Thank you for choosing  <strong> Camer Bus Travels </strong>. We look forward to serving you!</p>

                              <div style="margin-top: 20px; border-top: 1px solid #dddddd; padding-top: 20px;">
                                  <p style="color: #666666; font-size: 16px; margin-bottom: 5px;">Best regards, <br>                                  
                               <strong> Camer Bus Travels </strong><br>
                                  <a href="mailto:mailto:camertravel237@gmail.com" style="color: #007bff; text-decoration: none;">camertravel237@gmail.com</a> <br>
                                <a href="tel:+393275469245" style="color: #007bff; text-decoration: none;">+393275469245</a></p>
                              </div>
                          </div>
                      </body>
                      </html>

                    `
                                                          

                                                       
                                                       
                                                     
                                                        await sendBookingEmail( 
                                                          user.email,
                                                          "Your Booking has been confirmed",
                                                          emailContent ,
                                                          htmlContent
                                                         
                                                        );    
                                                        
                                                       
                                    }
                                    else
                                    {
                                       

                                        var trip1 = await TripModel.findOne({ _id : bookings[0].tripId})
                                        var trip2 = await TripModel.findOne({ _id : bookings[1].tripId})
                                        var driver1 = await DriverModel.findOne({ driverId : trip1.driverId})
                                        var driver2 = await DriverModel.findOne({ driverId : trip2.driverId})


                                      
                                     

                                      const passengerDetails = bookings[0].passengers.map((passenger, index) => {
                                        const seatNumber = bookings[0].selectedSeatNumbers[index];
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
                                      }).join("\n");
                                                            // Generate email content
                                                        const passengerDetails1 = bookings[1].passengers.map((passenger, index) => {
                                                          const seatNumber = bookings[1].return_SeatNumbers[index];
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
                                                        }).join("\n");

                                             const emailContent = `<main style="width: 70%; margin: 30px auto; padding: 15px; background-color: #d3d3d3; border: 3px solid #000; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
  <div style="text-align: center;">
    <h2 style="font-size: 24px; font-family: 'Arial Black', sans-serif; color: #556b2f; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Camer Bus Travels</h2>
    <h3 style="font-size: 18px; font-weight: 700; color: #000; margin: 0;">Book-Ticket</h3>
  </div>

  <hr style="border-top: 1px dashed #007bff; margin: 15px 0;">

  <div style="margin: 15px 0;">
    <p style="font-size: 14px; margin-bottom: 8px;"><strong>Dear ${user.fullName},</strong></p>
    <p style="font-size: 12px; margin-bottom: 15px;">Your booking has been confirmed.</p>

    <div style="background-color: #fff; border-radius: 6px; padding: 15px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
      <!-- Outbound Details -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #000; margin-bottom: 8px;">Outbound Details</h3>
        <div style="display: flex; justify-content: space-between;">
          <div style="flex: 1;">
            <p style="font-size: 14px; margin: 0;"><strong>Booking ID:</strong> ${bookings[0].bookingId}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Trip Number:</strong> ${trip1.tripNumber}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Bus Number:</strong> ${trip1.bus_no}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Driver Name:</strong> ${driver1.driverName}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Driver Contact:</strong> ${driver1.driverContact}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Starting Time:</strong> ${trip1.startingTime}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Total Amount Paid:</strong> ${bookings[0].totalFare}</p>
          </div>
          <div style="flex: 1;">
            <p style="font-size: 14px; margin: 0;"><strong>Source:</strong> ${bookings[0].source}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Destination:</strong> ${bookings[0].destination}</p>
          </div>
        </div>
        <!-- Passenger Details Section -->
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #000; margin-bottom: 8px;">Passenger Details</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #007bff; color: #fff;">
                <th style="padding: 8px; font-size: 14px;">Passenger Name</th>
                <th style="padding: 8px; font-size: 14px;">Age</th>
                <th style="padding: 8px; font-size: 14px;">Gender</th>
                <th style="padding: 8px; font-size: 14px;">Seat Number</th>
              </tr>
              ${passengerDetails}
            </table>
          </div>
        </div>
      </div>

                                            <!-- Return Details -->
                                            <div>
                                              <h3 style="font-size: 18px; font-weight: 700; color: #000; margin-bottom: 8px;">Return Details</h3>
                                              <div style="display: flex; justify-content: space-between;">
                                                <div style="flex: 1;">
                                                  <p style="font-size: 14px; margin: 0;"><strong>Booking ID:</strong> ${bookings[1].bookingId}</p>
                                                  <p style="font-size: 14px; margin: 0;"><strong>Trip Number:</strong> ${trip2.tripNumber}</p>
                                                  <p style="font-size: 14px; margin: 0;"><strong>Bus Number:</strong> ${trip2.bus_no}</p>
                                                  <p style="font-size: 14px; margin: 0;"><strong>Driver Name:</strong> ${driver2.driverName}</p>
                                                  <p style="font-size: 14px; margin: 0;"><strong>Driver Contact:</strong> ${driver2.driverContact}</p>
                                                  <p style="font-size: 14px; margin: 0;"><strong>Starting Time:</strong> ${trip2.startingTime}</p>
                                                  
                                                </div>
                                                <div style="flex: 1;">
                                                  <p style="font-size: 14px; margin: 0;"><strong>Source:</strong> ${bookings[1].source}</p>
                                                  <p style="font-size: 14px; margin: 0;"><strong>Destination:</strong> ${bookings[1].destination}</p>
                                                  <!-- Add more return ticket details here if needed -->
                                                </div>
                                              </div>
                                            </div>

                                            <!-- Passenger Details Section -->
                                            <div style="margin-top: 20px;">
                                              <h3 style="font-size: 18px; font-weight: 700; color: #000; margin-bottom: 8px;">Passenger Details</h3>
                                              <div style="overflow-x: auto;">
                                                <table style="width: 100%; border-collapse: collapse;">
                                                  <tr style="background-color: #007bff; color: #fff;">
                                                    <th style="padding: 8px; font-size: 14px;">Passenger Name</th>
                                                    <th style="padding: 8px; font-size: 14px;">Age</th>
                                                    <th style="padding: 8px; font-size: 14px;">Gender</th>
                                                    <th style="padding: 8px; font-size: 14px;">Seat Number</th>
                                                  </tr>
                                                  ${passengerDetails1}
                                                </table>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <!-- Footer -->
                                      </main>`;
                                                     
                                      

                                      const htmlContent = `<!DOCTYPE html>
                                      <html lang="en">
                                      <head>
                                          <meta charset="UTF-8">
                                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                          <title>Booking Confirmation</title>
                                      </head>
                                      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5;">
                                          <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                                              <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px; text-align: center;">Booking Confirmation</h1>
                
                                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">Dear ${user.fullName},</p>
                
                                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">We are delighted to inform you that your booking with <strong> Camer Bus Travels </strong>  has been successfully processed.</p>
                
                                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">If you have any questions or need further assistance, please feel free to contact our customer service team at <a href="tel:+393275469245" style="color: #007bff; text-decoration: none;"> +393275469245 </a> or reply to this email.</p>
                
                                              <p style="color: #666666; font-size: 16px; margin-bottom: 10px;">Thank you for choosing  <strong> Camer Bus Travels </strong>. We look forward to serving you!</p>
                
                                              <div style="margin-top: 20px; border-top: 1px solid #dddddd; padding-top: 20px;">
                                                  <p style="color: #666666; font-size: 16px; margin-bottom: 5px;">Best regards, <br>                                  
                                               <strong> Camer Bus Travels </strong><br>
                                                  <a href="mailto:mailto:camertravel237@gmail.com" style="color: #007bff; text-decoration: none;">camertravel237@gmail.com</a> <br>
                                                <a href="tel:+393275469245" style="color: #007bff; text-decoration: none;">+393275469245</a></p>
                                              </div>
                                          </div>
                                      </body>
                                      </html>
                
                                    `
                                                        await sendReturnEmail(
                                                          user.email,
                                                          "Your Booking has been confirmed",
                                                          emailContent,
                                                          htmlContent
                                                         
                                                        );

                                                        
                                                      }
                                                      return res.status(200).json({
                                                        success: true,
                                                        message: 'Booking confirmed successfully',
                                                      });
                                                          
                                                    }
                                                    const paymentKey = transaction.payment_key;
                                                      switch (paymentKey) {
                                                        case 1: // Stripe
                                                          await generateAndSendEmail(1);
                                                          break;
                                                        case 2: // MTN
                                                          await generateAndSendEmail(2);
                                                          break;
                                                        case 3: // Orange
                                                          await generateAndSendEmail(3);
                                                          break;
                                                        default:
                                                          // Handle unsupported payment method
                                                          return res.status(400).json({
                                                            success: false,
                                                            message: 'Unsupported payment method',
                                                          });
                                                      }                                                
                                                                                         
                                                    } catch (error) {
                                                      return res.status(500).json({
                                                        success: false,
                                                        message: 'Server error',
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
                                  
        // api for get details of booking

         const getBooking = async ( req , res ) => {
               try {
                        const bookingId = req.params.bookingId
                    // check for bookingId

                  if(!bookingId)
                    {
                      return res.status(400).json({
                         success : false ,
                         message : 'booking Id required'
                      })
                    }

                // check for booking
                const booking = await BookingModel.findOne({
                  bookingId : bookingId 
                })              

                // check transaction

                const transaction = await TransactionModel.findOne({
                          bookingId : bookingId

                })
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
                    } else if (dayBeforeTrip <= 2) {
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

                      return res.status(200).json({
                          success : true ,
                          message : 'booking Details',
                          cancellationType : cancellationType,
                          refundAmount : refundAmount,
                          booking_details : booking,
                          transaction_details : transaction
                      })

               } catch (error) {
                  return res.status(500).json({
                     success : false ,
                     message : 'server error',
                     error_message : error.message
                  })
               }
         }
                                  
                                  // Api for cancle tickit
  const cancelTicket = async (req, res) => {
                                    try {
                                      const { email, bookingId  } = req.body;
                                      let refundAmount = req.body.refundAmount
                                      
                                  
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
                                          .status(400)
                                          .json({
                                            success: false,
                                            BookingNotFound: "Booking not found with the given ID",
                                          });
                                      }
                                  
                                      // Fetch the user associated with the booking
                                      const user = await UserModel.findOne({  _id : booking.userId } );
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
                                        const chargeId = transaction.chargeId || transaction.request_id;
                                  
                                        if (chargeId) {
                                          if (transaction.payment_key === 1) {
                                            let refundMethod = 'Stripe Payment';
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

                                                
                                              
                                                

                                                const emailContent1 = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                                                <p><strong>Dear ${user.fullName},</strong></p>
                                                
                                                <p>We are delighted to inform you that your refund for the recent <strong>transaction ${transaction.chargeId || transaction.request_id} </strong> has been successfully processed.</p>
                                                
                                                <div style="margin-top: 20px;">
                                                    <p><strong>Refund Details:</strong></p>
                                                    <ul>
                                                        <li><strong>Transaction ID:</strong> ${transaction.chargeId || transaction.request_id}</li>
                                                        <li><strong>Refund Amount:</strong> ${transaction.amount}</li>
                                                        <li><strong>Refund Method:</strong> ${refundMethod}</li>
                                                    </ul>
                                                </div>
                                                
                                                <p>The refunded amount should reflect in your account shortly. Depending on your bank or payment provider, it may take a few business days for the funds to appear.</p>
                                                
                                                <p>If you have any questions or concerns regarding your refund or any other matter, please feel free to reach out to our customer support team. We are here to assist you in any way we can.</p>
                                                
                                                <p>Thank you for your understanding and cooperation throughout this process. We appreciate your business and look forward to serving you again in the future.</p>
                                                
                                                <div style="margin-top: 20px;">
                                                    <p><strong>Best regards,</strong></p>
                                                    <p><strong>Camer Bus Travels</strong></p>
                                                </div>
                                            </div>`

                                            await sendCancelEmail(
                                              user.email,
                                              "Ticket Cancellation Confirmation",
                                              emailContent1
                                            );
                    
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
                                          }
                                          else if (transaction.payment_key === 2 || transaction.payment_key === 3) {
                                            transaction.payment_status = "cancel";
                                            transaction.amount = refundAmount;
                                            await transaction.save();
                                        }
                                      }}
                            
                                              const newNotification = new NotificationDetail({
                                                userId: booking.userId,
                                                message: ` your booking : ${bookingId} has been cancelled  `,
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
                                                message: `cancel booking request sent by the user : ${userName} in a trip : ${tripNumber} with bookingId : ${bookingId} , refund amount should be ${refundAmount}`,
                                                date: new Date(),
                                                bookingId: bookingId,
                                                tripId: booking.tripId,
                                              });
                                              await newAdminNotification.save();
                      
                                              await booking.save();
                                              await trip.save();
                      
                                              // Send a cancellation email to the user
                                              const emailContent = `<!DOCTYPE html>
                                              <html>
                                              <head>
                                                  <title>Cancellation Confirmation</title>
                                              </head>
                                              <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
                                                  <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                                                      <h2 style="color: #000;">Booking Cancellation</h2>
                                                      <p>Dear ${user.fullName},</p>
                                                      <p>We regret to inform you that your booking with Booking ID <span style="font-weight: bold;">${booking.bookingId}</span> has been canceled.</p>
                                                      <p>Refund Amount: <span style="font-weight: bold;">${refundAmount}</span></p>
                                                      <p>Your refund will be processed within 5 to 10 working days.</p>
                                                      <p>Thank you for choosing our service.</p>
                                                      <p><b>Sincerely,<br>Camer Bus Travels</b></p>
                                                  </div>
                                              </body>
                                              </html>
                                              
                                              
                                              `;
                                              await sendCancelEmail(
                                                user.email,
                                                "Ticket Cancellation Confirmation",
                                                emailContent
                                              );
                      
                                              res.status(200).json({
                                                success: true,
                                                SuccessMessage:
                                                  "Ticket cancellation successfully",
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

                                  // Api for refund mtn and orange
                                const refund_o_m = async( req , res ) => {
                                         try {
                                                const bookingId = req.params.bookingId
                                            // check for bookingId
                                            if(!bookingId)
                                              {
                                                return res.status(400).json({
                                                      success :  false ,
                                                      message : 'booking Id required '
                                                })
                                              }

                                           // check for transaction

                                           const transaction = await TransactionModel.findOne({
                                                     bookingId : bookingId
                                           })

                                           // check for booking 

                                           const booking = await BookingModel.findOne({
                                                   bookingId : bookingId
                                           })

                                             // check for user

                                             const user = await UserModel.findOne({
                                                      _id : booking.userId
                                             })


                                                const payment_key = transaction.payment_key
                                                let refundMethod = '';
                                                if(payment_key === 2)
                                                  {
                                                      refundMethod = 'MTN MOMO'
                                                      transaction.payment_status = 'cancelled'
                                                     await  transaction.save()
                                                  }
                                                  else if( payment_key === 3)
                                                  {
                                                    refundMethod = 'Orange Money'
                                                    transaction.payment_status = 'cancelled'
                                                     await  transaction.save()
                                                  }



                                                  const emailContent = `
                                                  <div style="font-family: Arial, sans-serif; padding: 20px;">
                                                      <p><strong>Dear ${user.fullName},</strong></p>
                                                      
                                                      <p>We are delighted to inform you that your refund for the recent <strong>transaction ${transaction.chargeId || transaction.request_id} </strong> has been successfully processed.</p>
                                                      
                                                      <div style="margin-top: 20px;">
                                                          <p><strong>Refund Details:</strong></p>
                                                          <ul>
                                                              <li><strong>Transaction ID:</strong> ${transaction.chargeId || transaction.request_id}</li>
                                                              <li><strong>Refund Amount:</strong> ${transaction.amount}</li>
                                                              <li><strong>Refund Method:</strong> ${refundMethod}</li>
                                                          </ul>
                                                      </div>
                                                      
                                                      <p>The refunded amount should reflect in your account shortly. Depending on your bank or payment provider, it may take a few business days for the funds to appear.</p>
                                                      
                                                      <p>If you have any questions or concerns regarding your refund or any other matter, please feel free to reach out to our customer support team. We are here to assist you in any way we can.</p>
                                                      
                                                      <p>Thank you for your understanding and cooperation throughout this process. We appreciate your business and look forward to serving you again in the future.</p>
                                                      
                                                      <div style="margin-top: 20px;">
                                                          <p><strong>Best regards,</strong></p>
                                                          <p><strong>Camer Bus Travels</strong></p>
                                                      </div>
                                                  </div>
                                              `;
                                              

                                              await sendCancelEmail(
                                                user.email,
                                                "Refund successfully",
                                                emailContent
                                              );
                                            
                                              return res.status(200).json({
                                                     success : true ,
                                                     message : 'refund successfully'
                                              })
                                        
                                         } catch (error) {
                                            return res.status(500).json({
                                               success : false ,
                                               message : 'server error',
                                               error_message : error.message
                                            })
                                         }
                                }         
                                  
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
                                            monthlyStartDate.setMonth(startDate.getMonth() - 1);
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
                                  
                                      if (status) {
                                        const lowercaseStatus = status.toLowerCase();
                                        if (lowercaseStatus === "confirmed") {
                                          bookings = await BookingModel.find({ status: "confirmed", ...dateFilter });
                                        } else if (["pending", "cancelled"].includes(lowercaseStatus)) {
                                          bookings = await BookingModel.find({ status: lowercaseStatus, ...dateFilter });
                                        } else {
                                          return res.status(400).json({
                                            success: false,
                                            error: "Invalid status value",
                                          });
                                        }
                                      } else {
                                        // If status is not provided, retrieve all bookings
                                        bookings = await BookingModel.find(dateFilter);
                                      }
                                  
                                      // Calculate booking statistics
                                      const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
                                      const cancelledBookings = bookings.filter((booking) => ["pending", "cancelled"].includes(booking.status));
                                      const totalBookings = bookings.length;
                                  
                                      // Sort bookings by creation date in descending order
                                      const sortedBookings = bookings.sort(( a , b ) => b.createdAt - a.createdAt);
                                  
                                      res.status(200).json({
                                        success: true,
                                        message: "All Bookings",
                                        bookings: sortedBookings,
                                        totalBookings,
                                        confirmedBookings: confirmedBookings.length,
                                        cancelledBookings: cancelledBookings.length,
                                      });
                                    } catch (error) {
                                      console.error("Error finding bookings:", error);
                                      res.status(500).json({ success: false, error: "Error finding bookings" });
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
                                                                 

module.exports = {
    bookTicket,
    cancelTicket,
    userTickets,   
    allBookings,
    countBookings,   
    updateBooking,
    getBookingTrip,
    getBookings_By_Date,
    getbooking_by_tripNumber,
    getBooking , 
    refund_o_m ,




  
}
                                                          