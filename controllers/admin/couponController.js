import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Admin from "../../models/adminSchema.js";
import bcrypt from "bcrypt";
import User from "../../models/userSchema.js";
import Order from "../../models/orderSchema.js";
import Address from "../../models/addressSchema.js";
import Refund from "../../models/refundSchema.js";
import Coupon from "../../models/couponSchema.js";

const renderCouponPage = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.render("admin/coupon", { coupons });
  } catch (error) {
    res.status(500).send("Failed to load coupons");
  }
};


const createCoupon = async (req, res) => {
  try {
    const { name, expiresOn, offerPrice, minimumPrice, isListed } = req.body;

    const existing = await Coupon.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Coupon with this name already exists" });
    }

    const coupon = new Coupon({
      name,
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

export default {
    renderCouponPage,
    createCoupon,
}