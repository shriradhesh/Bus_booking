const { text } = require('body-parser');
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    email: {
        type: String,
    },
    companyName: {
        type: String,
    },
    message: {
        type: String,
    } 
    
 
});

const contactModel = mongoose.model('contactModel', contactSchema);

module.exports = contactModel;
