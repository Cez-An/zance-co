import STATUS_CODE from "../../helpers/statusCode.js";
import User from "../../models/userSchema.js";
import nodemailer from "nodemailer";
import env from "dotenv";
import bcrypt from "bcrypt";
import { STATES } from "mongoose";
import { render } from "ejs";

env.config();

const loadHomepage = async (req, res) => {
  try {
    console.log("ACCESSED LOADHOMEPAGE");

    const user = req.session.user;

    if (user) {
      console.log(user);

      // const userData = await User.findOne({_id:user._id})

      res.render("user/home", { user: user });
    } else {
      console.log("ELSE ACCESSED ");

      return res.render("user/home");
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
    console.log("ACCESSED loadlogin");

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

      return res.render("user/signup", { message: "user already exists" }); // re-rendering is happening so the message is passed as message.
    }

    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.json("email error");
    }

    req.session.userOtp = otp;
    req.session.userData = { email, password, name, number };
    // req.session.user =  findUser;

    res.redirect("/user/verifyOtp");
    console.log("Otp sent", otp);
  } catch (error) {
    console.error("signup error", error);
    res.render("/pageNotFound");
  }
};

const loadOtpVerification = async (req, res) => {
  res.render("user/verifyOtp");
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

    // Check if OTP exists in session

    if (!req.session.userOtp) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "OTP session expired. Request a new OTP.",
      }); // while using ajax or fetch we give message as json data
    }

    // Convert both to strings for safe comparison

    if (otp.toString() === req.session.userOtp.toString()) {
      //   const userId = (function generateUserId() {
      //     return (
      //         String.fromCharCode(65 + Math.random() * 26, 65 + Math.random() * 26) +
      //         Math.floor(1000 + Math.random() * 9000)
      //     );
      // })();

      // console.log(userId);

      const user = req.session.userData;

      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name: user.name,
        // userId:userId,
        email: user.email,
        phone: user.number,
        password: passwordHash,
      });

      await saveUserData.save();

      req.session.user = saveUserData;

      // console.log("User Session:", req.session.user);

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

const resendOtp = async (req, res) => {
  try {
    console.log("resend otp accessed");

    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Email mot found is session" });
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
    console.log("login route accesed");

    const { email, password } = req.body;

    const findUser = await User.findOne({ email: email.trim() });

    console.log(findUser);

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
    console.log(req.session.user);

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
    return res.render("user/productsdetailspage");
  } catch (error) {
    console.error("Error loading product details:", error);
    return res.status(500).send("Internal Server Error");
  }
};


const loadForgotPassword = async (req, res) => {
  try {
    res.render("user/forgotPassword",{message:''});
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .redirect("/error-admin");
  }
};


const loadForgotPasswordOtp = async (req, res) => {
  try {
    res.render("user/forgotPasswordOtp");
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .redirect("/error-admin");
  }
};

const validateEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("user/forgotPassword", { message: "This email is not registered."});
    }
    res.json({ success: true, redirectUrl: "/user/forgotPasswordOtp" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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
  validateEmail,
};
