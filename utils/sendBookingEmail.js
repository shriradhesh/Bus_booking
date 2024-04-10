const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const generateBookingPDF = async (user, trip, bookingId, newBookingId,  selectedSeatNumbers, totalFare_in_Euro) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
  
        // Buffer to store PDF content
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
  
        // Add user and trip details to the PDF
        doc.fontSize(12).text(`Full Name: ${user.fullName}`);
        doc.fontSize(12).text(`Trip Number: ${trip.tripNumber}`);
        doc.fontSize(12).text(`Bus Number: ${trip.bus_no}`);
        doc.fontSize(12).text(`Selected Seats: ${selectedSeatNumbers}`);
        doc.fontSize(12).text(`Starting Time: ${trip.startingTime}`);
       
       // Conditionally include either bookingId or newBookingId
       if (bookingId) {
        doc.fontSize(12).text(`Booking ID: ${bookingId}`);
         } else if (newBookingId) {
        doc.fontSize(12).text(`New Booking ID: ${newBookingId}`);
        }      
  
        doc.end();
    });
  };
       

const sendBookingEmail = async (recipientEmail, subject, text, user, trip, bookingId, newBookingId ,  selectedSeatNumbers, totalFare) => {
    try {
        const qrCodeImage = 'tickit-QRCODE.png';
        const pdfAttachment = await generateBookingPDF (user, trip, bookingId, newBookingId , selectedSeatNumbers, totalFare);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.SMTP_MAIL,
            to: recipientEmail,
            subject: subject,
            html: text,
            attachments: [
                {
                    filename: 'tickit-QRCODE.png',
                    path: qrCodeImage
                },
                {
                    filename: 'booking_details.pdf',
                    content: pdfAttachment
                }
            ]
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = sendBookingEmail  
