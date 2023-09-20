// Push Notification 
const sendPushNotification = (deviceToken , notificationData) =>{
    const message = {
      notification : {
        title : notificationData.title,
        body : notificationData.body,
      },
      token : deviceToken
    }
      FcmAdmin
        .messaging()
        .send(message)
        .then((response) =>{
          console.log('successfully send message : ', response );
        })
        .catch((error)=>{
          console.error('Error sending message : ', error);
        })
  }    

// send an upcoming journey notification 3 hour before the journey
  
    cron.schedule('0 3 * * *', () =>{
      const threeHourFromnow = new Date()
      threeHourFromnow.setHours(threeHourFromnow.getHours() + 3)

        // find bookings with the trip start times that match the calculated time

        BookingModel.find({
          'tripId.startingDate' : threeHourFromnow,
          status : 'confirmed'
        })
           .populate('userId', 'pushNotificationToken')
           .exec((err , bookings)=> {
            if(err){
              console.error('Error while fatching the booking', err);
              return
            }

            // send notification to users with pushNotificationToken\
            bookings.forEach((booking)=>{
              const { pushNotificationToken } = booking.userId
              const notificationData = {
                title : 'Upcoming Journey',
                body : `your Trip will start after 3 hour , get ready !!`
              }
              sendPushNotification(pushNotificationToken , notificationData)
            })
           })
    })


    module.exports = sendPushNotification