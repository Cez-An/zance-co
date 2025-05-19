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

env.config();

const renderHomepage = async (req, res) => {
  try {
    const product = await Product.find({ isBlocked: false }).limit(12).populate("category");
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const user = await User.findOne({ _id: userId, isBlocked: false });
    if(!user){
      req.session.user = false; 
      return res.render("user/home", {user,product})
    }
    console.log(`user is active `);

    const wishlistItems = await Wishlist.findOne({ userId }).populate("product");

    let wishlistProductIds = false;
    if (wishlistItems?.product?.length) {
      wishlistProductIds = wishlistItems.product.map((p) => p._id.toString());
    }

    return res.render("user/home", { user, product, wishlistProductIds });
  } catch (error) {
    console.log("HOME PAGE NOT LOADING", error);
    res.status(500).send("Server Error");
  }
};

const pageNotFound = async (req, res) => {
  try {
    res.render("partials/404");
  } catch (error) {
    res.redirect("/error");
  }
};

const logout = (req, res) => {
  console.log("User session destroyed");
  req.session.user=false;
  res.redirect("/user");
};

const loadProductsDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const user = await User.findOne({ _id: userId });
    const product = await Product.findOne({ _id: id }).populate("category");
    const relatedProducts = await Product.find({
      category: product.category,
    }).limit(4);
    const category = await Category.findOne({});
    return res.render("user/productDetailsPage", {
      product,
      user,
      relatedProducts,
    });
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
    if (req.session.passwordUpdated || req.session.Otpback) {
      res.redirect("/user/login");
    } else {
      res.render("user/forgotPasswordOtp");
    }
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .redirect("/error-admin");
  }
};

const FPotpVarification = async (req, res) => {
  const { otp } = req.body;
  const generatedOtp = req.session.userOtp;

  req.session.Otpback = true;

  if (otp.toString() === generatedOtp.toString()) {
    req.session.newpass = "";

    res.json({
      success: true,
      message: "Otp Verified Succefully",
      redirectUrl: "/user/newPassword",
    });
  }
};

const renderNewPassPage = async (req, res) => {
  try {
    if (req.session.passwordUpdated) {
      res.redirect("/user/login");
    } else {
      res.render("user/changePassword");
    }
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODE.NOT_FOUND);
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

const newPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const passwordHash = await securePassword(newPassword);
    const email = req.session.idUser;

    const user = await User.findOne({ email: email });

    await User.findByIdAndUpdate(user._id, {
      $set: { password: passwordHash },
    });

    req.session.passwordUpdated = true; //flag

    res
      .status(200)
      .json({
        message: "Password updated Successfully",
        redirectUrl: "/user/login",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default {
  renderHomepage, 
  pageNotFound, 
  logout,
  loadProductsDetails,
  loadForgotPassword,
  loadForgotPasswordOtp,  
  FPotpVarification,
  renderNewPassPage,
  newPassword,
};
