const fcmAdmin = require('firebase-admin')

const initializeFirebaseAdmin = ()=>{
    const serviceAccount = require('../config/camer-bus-firebase-adminsdk-gv5tv-71882d95a6.json')
    fcmAdmin.initializeApp({
        credential : fcmAdmin.credential.cert(serviceAccount)
    })
}

const sendPushNotification = async (tokens , title , body) =>{
    const message = {
        notification : {
            title ,
            body ,
        },
        tokens ,
    }
    try {
        const response = await fcmAdmin.messaging().sendMulticast(message)
        console.log('successfully sent message' , response);
    } catch (error) {
        console.error('error sending message', error);
    }
}

module.exports = {
    initializeFirebaseAdmin,
    sendPushNotification
}