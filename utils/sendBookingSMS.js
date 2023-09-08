const twilio = require('twilio')

const accountSid = 'ACea0cb782d52a715846acedc254632e9e';
const authToken = '9920e53cb0ddef7283f32ec3a392e531';
const client = require('twilio')(accountSid, authToken);

client.messages
    .create({
                from: '+16205914136',
        to: '+918839549283'
    })
    .then(message => console.log(message.sid))
    .done();   
