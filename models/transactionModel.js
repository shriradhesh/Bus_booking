const mongoose = require ('mongoose')
const transactionSchema = new mongoose.Schema({

       bookingId : {
        type : String,
        required : true ,
        unique : true
       },
       paymentIntentId : {
        type : String,
        required : true,
       },
       amount : {
        type : Number,
        required : true,
       },
       status: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        required : true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
})
const TransactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = TransactionModel;
