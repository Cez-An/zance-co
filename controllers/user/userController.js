import STATUS_CODE from "../../helpers/statusCode.js";
import User from "../../models/userSchema.js"
import nodemailer from 'nodemailer'
import env from 'dotenv'
import bcrypt from 'bcrypt'

env.config();

const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;
    if(user){

      const userData = await findOne({_id:user._id})
      res.render("user/home",{user:userData});

    }else{
      res.render("user/home");
    }
  } catch (error) {
    console.log("HOME PAGE NOT LOADING");
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Server Error");
  }
};

const loadSignUp = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    console.log('sign up page not loading');
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Server Error");
  }
};


const loadLogin = async (req, res) => {
  try {
      if (!req.session.user) {
          return res.render('user/login');
      } else {
          return res.redirect('/user/home');
      }
  } catch (error) {
      return res.redirect('/user/pageNotFound');
  }
};


const loadShop = async(req,res)=>{
  try {
    res.render('user/shop')
  } catch (error) {
    console.log('Shop page not loading');
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Server Error");
  }
}

function generateOtp(){
  return Math.floor(1000+Math.random()*9000).toString();
}

async function sendVerificationEmail(email,otp){
  try {

    const transporter = nodemailer.createTransport({
      service:'gmail',
      port:587,
      secure:false,
      requireTLS:true,
      auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD
      }
    })

    const info = await transporter.sendMail({
      from:process.env.NODEMAILER_EMAIL,
      to:email,
      subject:"Verify your Account",
      text:`your OTP is ${otp}`,
      html:`<b>Your OTP ${otp}</b>`,
    })
    return info.accepted.length>0;

  } catch (error) {
    console.error('Error sending email',error);
    return false;
  }
}

const signup = async(req,res)=>{
  try {
    const {name,email,number,password,confirmPassword} = req.body
    if(password!==confirmPassword){
      return res.render('/user/signup',{message:'password do not match'});
      }
      const findUser = await User.findOne({email});

      if(findUser){
        console.log(`User ALREADY EXSIST redirected to SIGN UP PAGE`)
       return res.render('user/signup',{message:'user already exists'})
      }

      const otp = generateOtp();

      const emailSent = await sendVerificationEmail(email,otp);

      if(!emailSent){
        return res.json("email error")
      }

      req.session.userOtp = otp;
      req.session.userData = {email,password,name,number};

      res.redirect('/user/verifyOtp');
      console.log("Otp sent",otp);
      

  } catch (error) {
    console.error("signup error",error);
    res.render("/pageNotFound")
  }
  
}

const loadOtpVerification = async (req,res)=>{
  res.render('user/verifyOtp')
}

const securePassword = async (password)=>{
  try {

    const passwordHash = await bcrypt.hash(password,10)
    return passwordHash

  } catch (error) {
    
  }
}

// const otpVerification = async (req,res)=>{
//   try {
//     console.log('OTP FUNCTION ACCESSED');

//     const {otp} = req.body;

//     console.log(otp);
    
//     if(otp === req.session.userOtp){

//       const user = req.session.userData;

//       const passwordHash = await securePassword(user.password)

//       const saveUserData = new User({
//         name:user.name,
//         email:user.email,
//         phone:user.number,
//         password:passwordHash,
//       })

//       await saveUserData.save();
//       req.session.user = saveUserData._id;
//       console.log(req.session.user)
//       res.status(200).json({success:true,redirectUrl:'/'})
//     }else{
//       res.status(STATUS_CODE.BAD_REQUEST).json({success:false,message:'Invalid OTP,Please try again'})
//     }
//   } catch (error) {
//     console.error('Error Verifying OTP');
//     res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({success:false,message:'An error occured'})
    
    
//   }
// }

const otpVerification = async (req, res) => {
  try {
      console.log('OTP FUNCTION ACCESSED');

      const { otp } = req.body;

      console.log('Stored OTP:', req.session.userOtp);
      console.log('User Entered OTP:', otp);

      // Check if OTP exists in session
      if (!req.session.userOtp) {
          return res.status(400).json({ success: false, message: "OTP session expired. Request a new OTP." });
      }

      // Convert both to strings for safe comparison
      if (otp.toString() === req.session.userOtp.toString()) {
          const user = req.session.userData;
          const passwordHash = await securePassword(user.password);

          const saveUserData = new User({
              name: user.name,
              email: user.email,
              phone: user.number,
              password: passwordHash,
          });

          await saveUserData.save();
          req.session.user = saveUserData._id;
          console.log('User Session:', req.session.user);

          res.status(200).json({ success: true, redirectUrl: '/' });
      } else {
          res.status(400).json({ success: false, message: 'Invalid OTP, Please try again' });
      }
  } catch (error) {
      console.error('Error Verifying OTP:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

const pageNotFound = async (req,res)=>{
  try {
    res.render('404')

  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const login = async(req,res)=>{
  try {
    const {email,password} = req.body;
    const findUser = await User.findOne({email})
    if(!findUser){
      return res.render('user/login',{message:"User not found"})
    }if(findUser.isBlocked){
      return res.render('user/login',{message:'User is blocked by admin'})
    }

    const passwordMatch = await bcrypt.compare(password,findUser.password)

    if(!passwordMatch){
      return res.render('user/login',{message:'Incorrect Password'})
    }

    req.session.user = findUser._id;
    res.redirect('/')

  } catch (error) {
    console.error('login error',error);
    res.render('user/login',{message:'login failed. Please try again later'})
    
  }
}


export default { loadHomepage, loadSignUp, loadLogin, loadShop, signup, loadOtpVerification, otpVerification, pageNotFound, login };
