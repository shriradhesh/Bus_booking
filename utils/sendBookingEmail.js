const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');


       

const sendBookingEmail = async (recipientEmail, subject, emailContent , htmlContent) => {
    try {
        // Generate PDF from HTML content using Puppeteer
        const pdfBuffer = await createPDF(emailContent);

        // Create a Nodemailer transporter using Gmail SMTP
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

        // Send email with attachment
        await transporter.sendMail({
            from: process.env.SMTP_MAIL,
            to: recipientEmail,
            subject: subject,
            html : htmlContent ,
            attachments: [
                {
                    filename: 'booking.pdf',
                    content: pdfBuffer,
                    encoding: 'base64',
                    contentType: 'application/pdf'
                }
            ]
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email sending failed");
    }
};

const createPDF = async (emailContent) => {
    try {
        const browser = await puppeteer.launch({
            // Adjust these options as needed
            headless: true, // or false to see Chromium in action
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Adjust viewport and wait for network idle
        await page.setViewport({ width: 1200, height: 800 }); // Adjust viewport size as needed
        await page.setContent(emailContent, { waitUntil: 'networkidle0' });

        // Generate PDF with a timeout
        const pdf = await page.pdf({ format: 'A4',  timeout: 60000 }); // Adjust timeout as needed

        await browser.close();
        return pdf;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('PDF generation failed: ' + error.message); // Log detailed error message
    }
};

module.exports = sendBookingEmail  






