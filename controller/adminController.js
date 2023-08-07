const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Admin = require('../models/adminModel')
const changePass  = require('../models/changePassword')
const BusModel = require('../models/busModel')
const cors = require('cors')

                      /* -->  ADMIN Api'S   <--    */

//admin login API
    
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
            
        // Find Admin by username
        const admin = await Admin.findOne({ username });
             
        if (!admin) {
            
            return res.status(400).json({ message: 'Username incorrect ', success: false });
        }          
  
        // Compare passwords using bcrypt
        const passwordMatch = await bcrypt.compare(password, admin.password);
     
        if (passwordMatch) {
            return res.json({ message: 'Admin Login Successfull', success: true , Data : admin });
        } else {
            return res.status(400).json({ message: 'Password incorrect', success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




  // APi for change  Login password 
        
            const changePassword = async (req, res)=>{
                try{
                    const { id , oldPassword , newPassword , confirmPassword} = req.body                
                      

                    // check for password match                     
                      
                      if( newPassword !== confirmPassword )
                      {
                        return res.status(400).json({ error : 'Password do not match' , success : false})
                      }

                       // find Admin by Id
                       
                       const admin = await Admin.findOne({_id:id})
                        
                       if(!admin){
                 
                        return res.status(404).json({ error : ' Admin not found' , success : false})
                       }
                       else
                       {
                                               
                         // check if old password match with stored password
                         
                         const isOldPasswordValid = await bcrypt.compare(oldPassword , admin.password)
                            if(!isOldPasswordValid)
                            {
                                return res.status(400).json({ error : 'Old Password incorrect ', success : false})
                            }
                      
                            // encrypt the newPassword 

                            const hashedNewPassword = await bcrypt.hash(newPassword ,10)
                            // update the admin password with new encrypted password 
                                    admin.password = hashedNewPassword
                                    await admin.save()
                                    return res.json({ message : ' Password changed Successfully', success : true})
                                
                        } 
                    }
                    
                catch(error)
                {
                    console.error(error);
                    res.status(500).json({ message : 'Internal server error ', success : false})
                }
            }


                                             /* BUS ROUTE MANAGEMENT */
        

                       const createBusRoute = async (req, res) => {
                        try {
                        const newRoute = await BusRoute.create(req.body);
                        res.status(200).json(newRoute);
                        } catch (error) {
                        res.status(400).json({ error: 'Bad request' });
                        }
                        }

module.exports = {adminLogin , changePassword}