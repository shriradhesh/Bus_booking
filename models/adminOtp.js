const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OTPSchema = new Schema({
    
    adminId: {
        type: Schema.Types.ObjectId,
      
        ref: "Admin",
    },
    
    otp: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, 
    },
});

const adminotpModel = mongoose.model('adminotpModel', OTPSchema);

module.exports = adminotpModel;
