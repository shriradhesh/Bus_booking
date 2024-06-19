const mongoose = require('mongoose')

const promo_Code_Schema = new mongoose.Schema({
           
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'      
    },  
      promo_code : {
            type : String
      },

      discount : {
             type : Number
      },
      start_Date : {
            type : Date
      },
      end_Date : {
        type : Date
      },
      offer_title : {
        type : String
 },
      offer_description : {
     type : String,
 },
 limit : {
     type : Number
 }

}, { timestamps : true })

const promo_Code_Model = mongoose.model('promo_code', promo_Code_Schema)

module.exports = promo_Code_Model