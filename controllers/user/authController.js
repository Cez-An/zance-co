import STATUS_CODE from "../../helpers/statusCode.js";
import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Category from "../../models/categorySchema.js";
import nodemailer from "nodemailer";
import env from "dotenv";
import bcrypt from "bcrypt";
import { STATES } from "mongoose";
import { render } from "ejs";
import { generateUserId } from "../../helpers/customerId.js";
import { log } from "console";
import Wishlist from "../../models/wishListSchema.js";
import { defaultMaxListeners } from "events";

env.config();

  const renderSignUp = async (req, res) => {
    try {
      res.render("user/signup");
    } catch (error) {
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Server Error");
    }
  };

  const signup = async (req, res) => {
    try {
      const { name, email, number, password,referal, confirmPassword } = req.body;
      req.session.referalcode = referal;
      console.log(referal)
      if (password !== confirmPassword) {
        return res.render("/user/signup", { message: "password do not match" });
      }
      const findUser = await User.findOne({ email });
  
      if (findUser) {
        return res.render("user/signup", { message: "user already exists" });
      }
  
      const otp = generateOtp();
  
      const emailSent = await sendVerificationEmail(email, otp);
  
      if (!emailSent) {
        return res.json("signup email could not be sent");
      }
  
      req.session.userOtp = otp;
      req.session.userData = { email, password, name, number };
      req.session.otpExpiry = Date.now() + 60 * 1000;

      res.redirect("/user/verifyOtp");


      console.log("Otp sent", otp);
    } catch (error) {
      console.error("signup error", error);
      res.render("/pageNotFound");
    }
  };  

  const renderotp = async (req, res) => {
    res.render("user/verifyOtp", {
      otpExpiry: req.session.otpExpiry
    });
  }


  const renderLogin = async (req, res) => {
    try {
      if (req.session.user) {
        return res.redirect("/user");
      }
  
      let message = "";
      const { error } = req.query;
  
      switch (error) {
        case "user_not_found":
          message = "User not found";
          break;
        case "blocked":
          message = "User is blocked by admin";
          break;
        case "incorrect_password":
          message = "Incorrect Password";
          break;
        case "server_error":
          message = "Login failed. Please try again later";
          break;
        case "google_auth_failed":
          message = "Google authentication failed. Please try again.";
          break;
      }
  
      return res.render("user/login", { message });
  
    } catch (error) {
      console.error("loadLogin error", error);
      return res.redirect("/user/pageNotFound");
    }
  };

  const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const findUser = await User.findOne({ email: email.trim() });
  
      if (!findUser) {
        return res.redirect("/login?error=user_not_found");
      }
  
      if (findUser.isBlocked) {
        return res.redirect("/login?error=blocked");
      }
  
      const passwordMatch = await bcrypt.compare(password, findUser.password);
  
      if (!passwordMatch) {
        return res.redirect("/login?error=incorrect_password");
      }
  
      req.session.user = findUser;
  
      res.redirect("/user");
    } catch (error) {
      console.error("login error", error);
      res.redirect("/login?error=server_error");
    }
  };

  const renderOtpVerification = async (req, res) => {
    try {
      if (req.session.isOtpVerified) {
        return res.redirect("/user");
      }
      res.render("user/verifyOtp");
    } catch (error) {
      console.error("Error in otp Authentication", error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Internal server error");
    }
  };
    
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

      if (Date.now() > req.session.otpExpiry) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: "OTP has expired. Please request a new one.",
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
  
        req.session.user = saveUserData;
        const referalcode = req.session.referalcode;

        const referedUser = await User.findOne({ referalCode: referalcode });
        console.log(referedUser);
        
        if (referedUser) {
            saveUserData.wallet += 50; 
            referedUser.wallet = (referedUser.wallet || 0) + 50;
            referedUser.redeemedUsers.push(saveUserData._id);
            await referedUser.save();
        }
        await saveUserData.save();
        res
          .status(STATUS_CODE.SUCCESS)
          .json({ success: true, redirectUrl: "/user/login" });
      } else {
        res.status(STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: "Invalid OTP, Please try again backend",
        });
      }
    } catch (error) {
      console.error("Error Verifying OTP:", error);
      res
        .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "An error occurred" });
    }
  };

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

  function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const securePassword = async (password) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      return passwordHash;
    } catch (error) {
      res.redirect("/error");
    }
  };
  
  const resendOtp = async (req, res) => {
    try {

      const { email } = req.session?.userData ?? req.session?.userEmail;
  
      if (!email) {
        return res
          .status(STATUS_CODE.BAD_REQUEST)
          .json({ success: false, message: "Email not found is session" });
      }
  
      const otp = generateOtp();
      req.session.userOtp = otp;
      req.session.otpExpiry = Date.now() + 60 * 1000;

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

  const validateUserEmail = async (req, res) => {
    try {
  
      const { email } = req.body;
      req.session.idUser = email;
      const user = await User.findOne({ email });
  
      if (!user) {
        
        return res.json({
          success: false,
          redirectUrl: "/user/forgotPassword",
          error: "This email is not registered",
        });
      } else {
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
  
        console.log("otp is ", otp);
  
        if (!emailSent) {
          return res.json("email error");
        }
  
        req.session.userOtp = otp;
        req.session.userEmail = { email };
        res.json({
          success: true,
          redirectUrl: "/user/forgotPasswordOtp",
          message: "This email is registered.",
          user,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
  };
  
  const getOtpExpiryTime = (req, res) => {
  if (req.session.otpExpiry) {
    return res.json({ expiry: req.session.otpExpiry });
  } else {
    return res.status(400).json({ error: "No OTP timer found" });
  }
  };
  
  export default {
    renderLogin,
    renderSignUp,
    signup,
    login,
    renderOtpVerification,
    otpVerification,
    resendOtp,
    validateUserEmail,
    getOtpExpiryTime,
    renderotp


  }