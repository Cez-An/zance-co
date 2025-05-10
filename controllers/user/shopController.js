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
    console.log(`renderShopPage ACCESS`);

    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const user = await User.findOne({ _id: userId });
    console.log(`user data in home page is `, user);

    const wishlistItems = await Wishlist.findOne({ userId }).populate("product");

    let wishlistProductIds = false;
    if (wishlistItems?.product?.length) {
      wishlistProductIds = wishlistItems.product.map((p) => p._id.toString());
    }
    const page = parseInt(req.query.page) || 1;

    const limit = 9;
    const skip = (page - 1) * limit;

    let filter = { isBlocked: false };

    if (req.query.result) {
      filter.name = { $regex: req.query.result, $options: "i" };
    }

    if (req.query.category) {
      let categories = req.query.category;
      const matchedCategories = await Category.find({
        name: { $in: categories },
        isListed: true,
      }).select("_id");
      console.log(matchedCategories);

      if (matchedCategories.length) {
        filter.category = { $in: matchedCategories.map((cat) => cat._id) };
        console.log("filter is", filter.category);
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
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
        },
      },
      { $sort: sortQuery },
      { $skip: skip },
    ]);

    console.log(products.length);

    const filterProduct = products
      .filter((product) => {
        return product.category.isListed === true;
      })
      .slice(0, limit);

    console.log(filterProduct.length);

    const categories = await Category.find({ isListed: true });
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("user/shop", {
      product: filterProduct,
      category: categories,
      appliedFilters: req.query,
      currentPage: page,
      totalPages,
      totalProducts,
      sortOption,
      user,
      wishlistProductIds,
      limit,
    });
  } catch (error) {
    console.error("Error loading shop:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR);
  }
};


export default {
    renderShopPage
}