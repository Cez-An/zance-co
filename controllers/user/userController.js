import STATUS_CODE from "../../helpers/statusCode.js";
import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js"
import Category from '../../models/categorySchema.js'
import nodemailer from "nodemailer";
import env from "dotenv";
import bcrypt from "bcrypt";
import { STATES } from "mongoose";
import { render } from "ejs";
import {generateUserId} from '../../helpers/customerId.js'
import { log } from "console";

env.config();

const loadHomepage = async (req, res) => {
  try {
    const product = await Product.find({isBlocked:false}).limit(12)

    const user = req.session.user;

    if (user) {
      res.render("user/home", { user: user,product });
    } else {

      return res.render("user/home",{product,user});
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
    console.log("sign up page not loading");
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Server Error");
  }
};

const loadLogin = async (req, res) => {
  try {

    if (!req.session.user) {
      return res.render("user/login");
    } else {
      return res.redirect("/user");
    }
  } catch (error) {
    return res.redirect("/user/pageNotFound");
  }
};

const loadShop = async (req, res) => {
  try {
    res.render("user/shop");
  } catch (error) {
    console.log("Shop page not loading");
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Server Error");
  }
};

 function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your Account",
      text: `your OTP is ${otp}`,
      html: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6510DC;">zance&co Account Verification</h2>
                    <p>Hello,</p>
                    <p>Your registered zance&co email is:</p>
                    <p style="font-size: 12px; font-weight: bold; color:#2118cc;">${email}</p>
                    <p>Your One-Time Password (OTP) for account verification:</p>
                    <p style="font-size: 24px; font-weight: bold; color:#2118cc;">${otp}</p>
                    <p>Please use this OTP to complete your registration process.</p>
                    <h5>If you did not request this registration, please contact - <a href="mailto:help@zance&cotech.com">help@zance&cotech.com</a></h5>
                    <p>Best regards,<br>The zance&co Team</p>
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #777;">This is an automated message. Please do not reply.</p>
                </div>
            `,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email", error);

    return false;
  }
}

const signup = async (req, res) => {
  try {
    const { name, email, number, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("/user/signup", { message: "password do not match" });
    }
    const findUser = await User.findOne({ email });

    if (findUser) {
      console.log(`User ALREADY EXSIST redirected to SIGN UP PAGE`);
      return res.render("user/signup", { message: "user already exists" }); 
    }

    const otp =  generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.json("email error");
    }

    req.session.userOtp = otp;
    req.session.userData = { email, password, name, number };

    res.redirect("/user/verifyOtp");
    console.log("Otp sent", otp);
  } catch (error) {
    console.error("signup error", error);
    res.render("/pageNotFound");
  }
};

const loadOtpVerification = async (req, res) => {

  try {
    if (req.session.isOtpVerified) {
      return res.redirect('/user'); 
  }
  res.render("user/verifyOtp");
  } catch (error) {    
    console.error("Error in otp Authentication", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Internal server error");
  }

  
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    res.redirect("/error");
  }
};

const otpVerification = async (req, res) => {
  try {
    console.log("OTP FUNCTION ACCESSED");

    const { otp } = req.body;

    console.log("Stored OTP:", req.session.userOtp);
    console.log("User Entered OTP:", otp);

    if (!req.session.userOtp) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "OTP session expired. Request a new OTP.",
      }); 
    }

    if (otp.toString() === req.session.userOtp.toString()) {

      req.session.isOtpVerified = true;
      const userId = await generateUserId();      
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);
      const saveUserData = new User({
        name: user.name,
        userId,
        email: user.email,
        phone: user.number,
        password: passwordHash,
      });

      await saveUserData.save();

      req.session.user = saveUserData;

      res.status(STATUS_CODE.SUCCESS).json({ success: true, redirectUrl: "/user/login" });
    } else {
      res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid OTP, Please try again backend",
      });
    }
  } catch (error) {
    console.error("Error Verifying OTP:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred" });
  }
};

const resendOtp = async (req, res) => {
  try {
    console.log("resend otp accessed");

    const { email } = req.session?.userData ?? req.session?.userEmail;
    console.log(email);
    
    if (!email) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Email not found is session" });
    }

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("resend otp:", otp);
      res
        .status(STATUS_CODE.SUCCESS)
        .json({ success: true, message: "OTP Resend Successfully" });
    } else {
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to resend OTP. Please try again",
      });
    }
  } catch (error) {
    console.error("error resending OTP", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error, Please try again later",
    });
  }
};

const pageNotFound = async (req, res) => {
  try {
    res.render("partials/404");
  } catch (error) {
    res.redirect("/error");
  }
};

const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const findUser = await User.findOne({ email: email.trim() });

    if (!findUser) {
      return res.render("user/login", { message: "User not found" });
    }
    if (findUser.isBlocked) {
      return res.render("user/login", { message: "User is blocked by admin" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render("user/login", { message: "Incorrect Password" });
    }

    req.session.user = findUser;

    res.redirect("/user");
  } catch (error) {
    console.error("login error", error);
    res.render("user/login", {
      message: "login failed. Please try again later",
    });
  }
};

const logout = (req, res) => {
  console.log("session destroy accessed");
  req.session.destroy();
  res.redirect("/user");
};

const loadProductsDetails = async (req, res) => {
  try { 
    const {id} = req.params;
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const user = await User.findOne({ _id: userId });
    console.log(`user is `,user);
    
    const product = await Product.findOne({_id:id});
    const relatedProducts = await Product.find({category:product.category}).limit(4);    
    return res.render("user/productDetailsPage",{product,user,relatedProducts});

  } catch (error) {
    console.error("Error loading product details:", error);
    return res.status(500).send("Internal Server Error");
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    res.render("user/forgotPassword");
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .redirect("/error-admin");
  }
};

const loadForgotPasswordOtp = async (req, res) => {
  try {
    if(req.session.passwordUpdated || req.session.Otpback){
      res.redirect('/user/login')
    }else{
      res.render("user/forgotPasswordOtp");
    }
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .redirect("/error-admin");
  }
};

const validateUserEmail = async (req, res) => {
  try {
    console.log(`EMAIL VALIDATION ACCESSED
      `);
    
    const { email } = req.body;
    req.session.idUser = email;
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`rendering forgot password page`);
     return res.json({ success: false,redirectUrl:"/user/forgotPassword",error:'This email is not registered'});
    }
    else{

      const otp =  generateOtp();
      const emailSent = await sendVerificationEmail(email, otp);

      console.log('otp is ',otp);

      if (!emailSent) {
        return res.json("email error");
      }
  
      req.session.userOtp = otp;
      req.session.userEmail = {email};
      res.json({ success: true, redirectUrl: "/user/forgotPasswordOtp",message:'This email is registered.',user });

    }
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const FPotpVarification = async (req,res)=>{
  const { otp } = req.body;
  const generatedOtp = req.session.userOtp;

  req.session.Otpback=true;

  if (otp.toString() === generatedOtp.toString()) {

      req.session.newpass = '';

      res.json({ success: true,message:"Otp Verified Succefully",redirectUrl:'/user/newPassword'})
}
}

const renderNewPassPage = async (req,res)=>{
  try {
    if(req.session.passwordUpdated){
      res.redirect('/user/login')
    }else{
      res.render('user/changePassword')
    }
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODE.NOT_FOUND)
  }
}

const newPassword = async (req,res)=>{
  try {
    const {newPassword} = req.body;
    const passwordHash = await securePassword(newPassword);
    const email = req.session.idUser
        
    const user = await User.findOne({email:email})

    await User.findByIdAndUpdate(user._id,{$set:{password:passwordHash}})

    req.session.passwordUpdated=true; //flag

    res.status(200).json({message:'Password updated Successfully',redirectUrl:'/user/login'})

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const renderShopPage = async (req, res) => {
  try { 
    console.log(`renderShopPage ACCESS`);
  
      const userId = req.session.user?.id ?? req.session.user?._id ?? null;
      console.log(userId);
      
      const user = await User.findOne({ _id: userId });

      const page = parseInt(req.query.page) || 1;
      
      const limit = 9;
      const skip = (page - 1) * limit;

      let filter = { isBlocked: false };
      if (req.query.result) {
          filter.name = { $regex: req.query.result, $options: "i" };
      }

      if (req.query.category) {
          let categories = req.query.category;
          const matchedCategories = await Category.find({name: { $in: categories }, isListed: true }).select('_id');
          console.log(matchedCategories);
          
          if (matchedCategories.length) {
              filter.category = { $in: matchedCategories.map(cat => cat._id) };
              console.log("filter is",filter.category);
              
          }
      }

      if (req.query.price) {
         filter.salePrice = { $lte: parseInt(req.query.price) };
      }

      const sortOption = req.query.sort || "newest";
      let sortQuery = {};
      switch (sortOption) {
          case "priceLowToHigh":
              sortQuery = { salePrice: 1 };
              break;
          case "priceHighToLow":
              sortQuery = { salePrice: -1 };
              break;
          case "aToZ":
              sortQuery = { name: 1 };
              break;
          case "zToA":
              sortQuery = { name: -1 };
              break;          
          default:
              sortQuery = { createdAt: -1 };
      }

      console.log(sortQuery);
      console.log(filter);
      
      const products = await Product.aggregate([
          { $match: filter },
          { $sort: sortQuery },
          { $skip: skip },
          { $limit: limit }
      ]);


      const categories = await Category.find({ isListed: true });
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);

      res.render("user/shop", {
          title: "Shop",
          product: products,
          category: categories,
          appliedFilters: req.query,
          currentPage: page,
          totalPages,
          totalProducts,
          sortOption,
          user,
          limit
      });

  } catch (error) {
      console.error("Error loading shop:", error);
      res.status(INTERNAL_SERVER_ERROR);
  }
};



const testing = async (req,res)=>{
  try {
    const product = await Product.find({isBlocked:false}).limit(12)

    let page = 'testing'

    res.render(`user/${page}`,{product})
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



export default {
  loadHomepage,
  loadSignUp,
  loadLogin,
  loadShop,
  signup,
  loadOtpVerification,
  otpVerification,
  resendOtp,
  pageNotFound,
  login,
  logout,
  loadProductsDetails,
  loadForgotPassword,
  loadForgotPasswordOtp,
  validateUserEmail,
  FPotpVarification,
  renderNewPassPage,
  newPassword,
  renderShopPage,
 




  testing,
};