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
},
notification_status : {
  type : Number,
  enum : [ 0 , 1 ],
  default : 1
}

},{
  timestamps: true,
});

const UsersNotificationModel = mongoose.model('UsersNotificationModel', UsersNotificationSchema);

module.exports = UsersNotificationModel;