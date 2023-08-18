const nodemailer = require('nodemailer')
const sendEmail = async(email , subject , text)=>{
    try{
        console.log('Sender Email:', process.env.SMTP_MAIL);
        console.log('Recipient Email:', email);
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
                to : [email],
                subject : subject,
                text : text,
             })
             console.log("email sent successfully");
    }catch(error)
    { 
        
       console.log(error, " email not sent ");
    }
}


module.exports = sendEmail