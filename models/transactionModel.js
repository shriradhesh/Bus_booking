const mongoose = require ('mongoose');
const AccessToken = require('twilio/lib/jwt/AccessToken');
const transactionSchema = new mongoose.Schema({

       bookingId : {
        type : String,
        required : true ,
        unique : true
       },
       chargeId : {
        type : String,
        // required : true,
       },
       amount : {
        type : Number,
       
       },
       payment_status: {
        type: String,       
        
    },
    mtn_access_token : {
       type : String
    },
    customer_key : {
      type : String
    },
    paymentRef : {
      type : String
    },
    notify_url : {
      type : String
    },
    request_id : {
      type : Number
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
      payment_key : {
        type : Number
      },
      subscriberMsisdn : {
        type : String
      },
      txnmode : {
        type : String
      },
      createtime : {
        type : String
      },
      accessToken : {
        type : String
      },
      payToken : {
        type : String
      },
      promoCode : {
        type : String
   },
     discount_price : {
        type : Number
   }


})
const TransactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = TransactionModel;
