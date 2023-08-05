const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt')

                         /* --> User API <-- */


// API for user Register 

            const userRegister =  async (req,res)=>{
               try{
               const { fullName, email , password } = req.body;

                  if(!fullName || !email || !password ){
                  return res.status(400).json({ error : 'Missing required Field ', success : false})
                  }
                              // check for email exist 
               const existUser = await UserModel.findOne({ email })
               if(existUser)
               {
                  return res.status(400).json({ error : ' Email Already Exist', success : false})
               }
                        // password hased
               const hashedPassword = await bcrypt.hash(password , 10)
               
               var newUser = new UserModel({
                  fullName : fullName,
                  email : email,
                  password : hashedPassword
               })
                     
                        // save Data into Database
               const data = await newUser.save()
               res.status(200).json({ message : ' User Created Successfully' , success : true, Data : data})
               }
               catch(error)
               {
               console.error(' Error while creating user', error)
               res.status(500).json({ error : 'Error while creating User' , success : false})
               }
            }


   // API for Login 
               
   const loginUser =async (req, res) => {
      try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
          return res.status(401).json({ error: 'Invalid email' , success : false });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid password' , success: false});
        }

            res.status(200).json({ message: 'Login Successfully', user: user , success : true });
        } catch (error) {
            res.status(500).json({ error: 'Error while login the user' , success: false });
        }
    }

               

module.exports = {userRegister , loginUser}