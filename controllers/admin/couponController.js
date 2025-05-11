import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Admin from "../../models/adminSchema.js";
import bcrypt from "bcrypt";
import User from "../../models/userSchema.js";
import Order from "../../models/orderSchema.js";
import Address from "../../models/addressSchema.js";
import Refund from "../../models/refundSchema.js";
import Coupon from "../../models/couponSchema.js";
import { log } from "console";

const renderCouponPage = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.render("admin/coupon", { coupons });
  } catch (error) {
    res.status(500).send("Failed to load coupons");
  }
};

const renderCouponAddPage = async (req, res) => {
  try {    
    res.render("admin/couponAdd");
  } catch (error) {
    res.status(500).send("Failed to load couponAdd Page");
  }
};

const createCoupon = async (req, res) => {
  try { 
    console.log("accessedDDDDDDDDDDDDDDDDDDDDDDDDD");
    
    const { name,description, expiresOn, offerPrice, minimumPrice, isListed } = req.body;

    const existing = await Coupon.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Coupon with this name already exists" });
    }

    const coupon = new Coupon({
      name,
      description,
      expiresOn,
      offerPrice,
      minimumPrice,
      isListed,

    });

    await coupon.save();
    res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCoupon = async (req, res) => {
  try {

    console.log("yyaysyysyasyas")
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const renderEditCouponPage = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Check if the coupon exists before rendering
    // const coupon = await Coupon.findById(id);
    // if (!coupon) return res.status(404).send("Coupon not found");

    res.render("admin/couponEdit", { couponId: id });
  } catch (error) {
    console.error("Error rendering edit coupon page:", error);
    res.status(500).send("Server Error");
  }
};


const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { name, description, expiresOn, offerPrice, minimumPrice, isListed } = req.body;

  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const expiryDate = new Date(expiresOn);
    if (expiryDate <= new Date()) {
      return res.status(400).json({ message: "Expiration date must be in the future" });
    }

    if (offerPrice <= 0 || minimumPrice <= 0) {
      return res.status(400).json({ message: "Prices must be greater than 0" });
    }

    coupon.name = name;
    coupon.description = description;
    coupon.expiresOn = expiryDate;
    coupon.offerPrice = offerPrice;
    coupon.minimumPrice = minimumPrice;
    coupon.isListed = isListed;

    await coupon.save();

    res.status(200).json({ message: "Coupon updated successfully", coupon });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export default {
    renderCouponPage,
    createCoupon,
    renderCouponAddPage,
    deleteCoupon,
    updateCoupon,
    renderEditCouponPage,
}