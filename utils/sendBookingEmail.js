const nodemailer = require('nodemailer')
const sendBookingEmail = async(recipientEmail , subject , text)=>{
    try{
        const qrCodeImage = 'tickit-QRCODE.png'
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:
            {
                user:process.env.SMTP_MAIL,
                pass:process.env.SMTP_PASSWORD
            }
        }) 
             await transporter.sendMail({
                from : process.env.SMTP_MAIL,
                to : recipientEmail,
                subject : subject,
                html : text,
                attachments : [
                    {
                        filename : 'tickit-QRCODE.png',
                        path : qrCodeImage
                    }
                ]
             })
             console.log("email sent successfully");
    }catch(error)
    { 
        
       console.log(error, " email not sent ");
    }
}


module.exports = sendBookingEmail