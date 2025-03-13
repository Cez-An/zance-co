import Product from "../../models/productsShema.js";
import User from "../../models/userSchema.js";
import Category from "../../models/categorySchema.js";
import fs, { access } from "fs";
import path from "path";
import sharp from "sharp";
import { log } from "console";

const loadproductAddPage = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });

    return res.render("admin/productsAdd", {
      cat: category,
    });
  } catch (error) {
    console.log("error occured while loading Product page");

    return res.redirect("/error");
  }
};

const loadProductsPage = async (req, res) => {
  try {
    let search = "";

    if (req.query.search) {
      console.log(search);

      search = req.query.search;
    }
    console.log("Accessed productInfo");

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const product = await Product.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = Product.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    }).countDocuments();

    const totalPages = Math.ceil(totalProducts / limit);

    res.render("admin/products", {
      product,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving product");
  }
};

const addProduct = async (req, res) => {
  try {
    console.log("add product accessed");

    const { name, description, category, basePrice, discount, stock } =
      req.body;

    const imageFilenames = req.files.map((file) => file.filename);

    const newProduct = new Product({
      name,
      category,
      description,
      salePrice: basePrice,
      productOffer: discount,
      quantity: stock,
      productImage: imageFilenames,
    });

    await newProduct.save();

    res.redirect('/admin/products')

  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving product");
  }
};

const editProduct = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.status(500).send("Error editing product");
  }
};

const productBlocked = async (req, res) => {
  try {
    console.log("assessed");

    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/products");
  } catch (error) {
    res.redirect("/error");
  }
};

const productUnBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/products");
  } catch (error) {
    res.redirect("/error");
  }
};

export default {
  loadproductAddPage,
  loadProductsPage,
  addProduct,
  editProduct,
  productBlocked,
  productUnBlocked,
};
