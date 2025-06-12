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

const renderShopPage = async (req, res) => {
  try {

    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const user = await User.findOne({ _id: userId });

    const wishlistItems = await Wishlist.findOne({ userId }).populate("product");
    let wishlistProductIds = false;
    if (wishlistItems?.product?.length) {
      wishlistProductIds = wishlistItems.product.map((p) => p._id.toString());
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    let filter = { isBlocked: false };

    // Search filter
    if (req.query.result) {
      filter.name = { $regex: req.query.result, $options: "i" };
    }

    // Category filter
    if (req.query.category) {
      const categories = Array.isArray(req.query.category) 
        ? req.query.category 
        : [req.query.category];
      
      const matchedCategories = await Category.find({
        name: { $in: categories },
        isListed: true,
      }).select("_id");

      if (matchedCategories.length) {
        filter.category = { $in: matchedCategories.map((cat) => cat._id) };
      }
    }

    // Price filter
    if (req.query.price) {
      filter.salePrice = { $lte: parseInt(req.query.price) };
    }

    // Sorting
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

    const totalProducts = await Product.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $match: { "category.isListed": true } },
      { $count: "count" },
    ]);

    const productCount = totalProducts[0]?.count || 0;
    const totalPages = Math.ceil(productCount / limit);

    const products = await Product.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $match: { "category.isListed": true } },
      { $sort: sortQuery },
      { $skip: skip },
      { $limit: limit },
    ]);

    const categories = await Category.find({ isListed: true });

    res.render("user/shop", {
      product: products,
      category: categories,
      appliedFilters: req.query,
      currentPage: page,
      totalPages,
      totalProducts: productCount,
      sortOption,
      user,
      wishlistProductIds,
      limit,
    });

  } catch (error) {
    console.error("Error loading shop:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("error", { 
      message: "Something went wrong when loading the shop page."
    });
  }
};

const aboutpage = async(req,res)=>{
  try {
    res.render("user/about")
  } catch (error) {
    console.error("Error loading about page:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("error", { 
      message: "Something went wrong when loading the about page."
    });
  }
}

const testing = async (req,res)=>{
  try {
    let page = "paymentFailed"
    res.render(`user/${page}`)
  } catch (error) {
    console.error("Error loading about page:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("error", { 
      message: "Something went wrong when loading the about page."
    });
  }
}

export default {
    renderShopPage,aboutpage,testing
}