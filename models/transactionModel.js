const mongoose = require ('mongoose')
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
        required : true,
       },
       payment_status: {
        type: String,       
        required : true,
    },
    partyId : {
      
        type : Number
    },
    externalId : {
      type : String
    },
    xReferenceId : {
      type : String
    },
    mtnApiKey : {
      type : String
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
      payment_key : {
        type : Number
      }

})
const TransactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = TransactionModel;
