const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel', 
    required: true,
  },
  status: {
    type: Boolean, 
    required: true,
  },
  reason:{
    type :  String,
  },     // Error message if the notification failed

  messageId: {
        type : String,
     }
});

const NotificationDetail = mongoose.model('NotificationDetail', notificationSchema);

module.exports = NotificationDetail;