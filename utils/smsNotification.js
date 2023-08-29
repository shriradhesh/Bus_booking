const express = require('express')
const twilio = require('twilio')
const accountSid = 'ACea0cb782d52a715846acedc254632e9e'
const authToken ='9920e53cb0ddef7283f32ec3a392e531'
const client = new twilio(accountSid , authToken)

async function sendSms (phone_no , message){
try
{ 
    await client.message.create({
        body : message,
        from : '+16205914136',
        to : phone_no
    })
    console.log(`sms send to ${phone_no} : ${message}`);
}
catch(error)
{
    console.error(`error sending sms to ${phone_no}` , error)
    throw new Error('Error sending SMS notification');
} 
}



module.exports = sendSms