import STATUS_CODE from "../../helpers/statusCode.js";
import User from "../../models/userSchema.js";
import Address from '../../models/addressSchema.js'
import Product from "../../models/productsShema.js"
import Category from '../../models/categorySchema.js'
import nodemailer from "nodemailer";
import env from "dotenv";
import bcrypt from "bcrypt";
import Order from "../../models/orderSchema.js"
import path, { format } from 'path';
import cloudinary from '../../helpers/cloudinary.js'
import Refund from "../../models/refundSchema.js";

env.config();


const renderProfileInfo = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(STATUS_CODE.UNAUTHORIZED).send("Unauthorized: No user session found");
    }
    const { email } = req.session.user;
    const user = await User.findOne({ email: email });
    
    res.render('user/personalinfo',{user})

  } catch (error) {
    console.log(`error loading User Profile`, error);
    res.status(STATUS_CODE.NOT_FOUND);
  }
};

const renderProfileEdit = async (req,res)=>{
  try {
    const {id} = req.params;
    const user = await User.findOne({userId:id});
    res.render('user/personalinfoEdit',{user})
    
  } catch (error) {
    console.log(`error loading User Profile`, error);
    res.status(STATUS_CODE.NOT_FOUND);
  }
}

const updateProfile = async (req, res) => {
  try {
    let { email, name, phone, gender } = req.body;
    const userId = req.query.id;

    const user = await User.findOne({ userId });

    // Check if the file is uploaded
    if (req.files && req.files.profilePic) {
      const file = req.files.profilePic;

      // Validate file type
      const allowedTypes = /jpeg|jpg|png|webp/;
      const extname = allowedTypes.test(path.extname(file.name).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (!extname || !mimetype) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Only JPEG, JPG, PNG, and WEBP images are allowed' });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'user_profiles', // You can set the folder as needed
        resource_type: 'image',
      });

      // Save the Cloudinary URL to the profilePic field
      user.profilePic = result.secure_url;
    }

    // Update other user details
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.gender = gender;

    await user.save();

    req.session.user = user;

    return res.status(STATUS_CODE.SUCCESS).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.log("BACK END Error updating profile:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
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
      subject: "Your OTP for zance&Co Profile Update",
      text: `your OTP is ${otp}`,      
    });
    return info.accepted.length > 0;

  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}

const otpVerification = async (req, res) => {
  try {

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

const sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, error: 'Email is required' });
  }

  const otp = generateOtp();
  req.session.emailOtp = otp;
  console.log(otp)

  try {
    await sendVerificationEmail(email, otp);
      res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Failed to send OTP' });
  }
}

const verifyOTP = (req, res) => {

  const { email, otp } = req.body;

  if (!email || !otp) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, error: 'Email and OTP are required' });
  }

  const storedData = req.session.emailOtp;

  console.log(`entred otp :`,storedData)
  console.log( `generated otp:`,otp)

  if (!storedData) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, error: 'No OTP found for this email' });
  }

  if (storedData === otp) {
      delete req.session.emailOtp;
      return res.json({ success: true, message: 'OTP verified successfully' });
  }

  res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, error: 'Invalid OTP' });
}

const loadAddress = async (req, res) => {

  const userId = req.session.user?.id ?? req.session.user?._id ?? null;

  if (!userId) return res.redirect('/user/login');

  const user = await User.findOne({_id : userId})
  const name = user.name;

  try {
      const addresses = await Address.find({ userId : userId });

      res.render('user/addrress', {          
          addresses,
          user,
          name, 
      });

  } catch (error) {
      console.error('Error loading addresses:', error);
      res.render('user/addrress', { title : "address", addresses: [], user: req.session.user });
  }
};

const loadAddAddress = async (req,res)=>{

  const userId = req.session.user?.id ?? req.session.user?._id ?? null;

  const user = await User.findOne({_id : userId})

  res.render('user/addAddress ', {title : "Address", user});
}

const addAddress = async (req, res) => {
  try {
      const {fullName, phone, addressLine1, addressLine2, landmark, city, state, country, altNumber, addressType, zipCode} = req.body;

      const userId = req.session.user?.id ?? req.session.user?._id ?? null;

      if (!fullName || !phone || !addressLine1 || !city || !state || !country) {
          return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "All required fields must be filled." });
      }

      let userAddress = await Address.findOne({ userId });

      if (!userAddress) {
          userAddress = new Address({
              userId,
              details: []
          });
      }

      const newIndex = userAddress.details.length;

      userAddress.details.push({
          index: newIndex,
          addressType,
          name: fullName,
          addressLine1,
          addressLine2,
          city,
          landmark,
          state,
          pincode: zipCode,
          phone,
          altPhone: altNumber
      });

      await userAddress.save();

      return res.status(STATUS_CODE.SUCCESS).json({ message: "Address added successfully" });

  } catch (error) {
      console.error("Error adding address:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: error.message || "Address creation error" });
  }
};


export default {
    renderProfileInfo, renderProfileEdit, updateProfile, generateOtp, sendVerificationEmail, otpVerification, 
    sendOTP, verifyOTP, loadAddress, loadAddAddress, addAddress,
}