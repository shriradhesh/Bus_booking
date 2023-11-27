const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel'      
},  

tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TripModel', 
     
},

date: {
    type: Date,
  
},
status: {
  type: String,
  enum: ['confirmed', 'pending', 'cancelled'],
  default: 'confirmed',
},
bookingId: {
  type: String,
},
message :
{
  type : String
},

},{
  timestamps: true,
});

const NotificationDetail = mongoose.model('NotificationDetail', notificationSchema);

module.exports = NotificationDetail;