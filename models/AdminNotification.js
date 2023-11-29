const mongoose = require('mongoose');

const AdminNotificationSchema = new mongoose.Schema({
userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel'      
},  
adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'      
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
message :
{
  type : String
},

},{
  timestamps: true,
});

const AdminNotificationDetail = mongoose.model('AdminNotificationDetail', AdminNotificationSchema);

module.exports = AdminNotificationDetail;