const mongoose = require('mongoose');

const UsersNotificationSchema = new mongoose.Schema({
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

bookingId: {
  type: String,
},
title :
{
  type : String
},
message :
{
  type : String
},
userEmail : {
  type : String
}

},{
  timestamps: true,
});

const UsersNotificationModel = mongoose.model('UsersNotificationModel', UsersNotificationSchema);

module.exports = UsersNotificationModel;