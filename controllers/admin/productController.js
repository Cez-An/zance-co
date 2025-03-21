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

    return res.redirect("/error-admin");
  }
};

const loadProductsPage = async (req, res) => {
  try {
    let search = "";

    if (req.query.search) {
      search = req.query.search;
    }
    console.log("Accessed productInfo");

    const page = parseInt(req.query.page) || 1;

    const limit = 10;
    const skip = (page - 1) * limit;

    const product = await Product.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    });

    const totalPages = Math.ceil(totalProducts / limit);

    // console.log(`${product} ${page} ${totalPages} ${totalProducts}`);

    res.render("admin/products", {
      product,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving product");
  }
};

const addProduct = async (req, res) => {
  try {
    console.log("add product accessed");

    const { name, description, category, basePrice, discount, stock, brand } =
      req.body;

    const imageUrls = req.files.map((file) => file.filename);

    const generateProductId = async () => {
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      const id = `ZNCP${randomNumber}`;
      const ifExists = await Product.findOne({ productId: id });
      if (ifExists) {
        return generateProductId();
      }
      return id;
    };

    
    const productId = await generateProductId();
      

    const newProduct = new Product({
      name,
      productId,
      category,
      description,
      brand: brand,
      salePrice: basePrice,
      productOffer: discount,
      quantity: stock,
      productImage: imageUrls,
    });

    await newProduct.save();

    res.redirect("/admin/products");
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
    res.redirect("/error-admin");
  }
};

const productUnBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/products");
  } catch (error) {
    res.redirect("/error-admin");
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
