const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Admin = require('../models/adminModel')

                      /* -->  ADMIN Api'S   <--    */

//admin login API
    



const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
            
        // Find Admin by username
        const admin = await Admin.findOne({ username });
             
        if (!admin) {
            console.log('Admin not found');
            return res.status(400).json({ message: 'Username incorrect ', success: false });
        }          
                
        const hashedPassword = await bcrypt.hash(admin.password , 10)
        // Compare passwords using bcrypt
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
     
               
        if (passwordMatch) {
            return res.json({ message: 'Login Successful', success: true });
        } else {
            return res.status(400).json({ message: 'password incorrect', success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




module.exports = {adminLogin}