import Product from "../../models/productsShema.js";
import User from "../../models/userSchema.js";
import Category from "../../models/categorySchema.js";
import fs, { access } from "fs";
import path from "path";
import sharp from "sharp";
import { log } from "console";
import { render } from "ejs";

const loadproductAddPage = async (req, res) => {
  try {
    console.log(`Rendering Add Product Page
      `);
    
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
    console.log(`Rendering Product Listing Page
      `);

    const page = parseInt(req.query.page) || 1;

    const limit = 10;
    const skip = (page - 1) * limit;

    const product = await Product.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    }).populate('category')
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
    // Destructure fields from req.body matching the form field names
    const { 
      name, 
      description, 
      category, 
      basePrice, 
      discount, 
      stock, 
      brand 
    } = req.body;

    // Map image URLs from uploaded files - field name matches 'variantImages' from form
    const imageUrls = req.files.map((file) => file.path || file.url);

    // Generate unique product ID
    const generateProductId = async () => {
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      const id = `ZNCP${randomNumber}`;
      const ifExists = await Product.findOne({ productId: id });
      if (ifExists) {
        return generateProductId();
      }
      return id;
    };

    // Find category by name
    const categoryFind = await Category.findOne({ name: category });
    if (!categoryFind) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid category" 
      });
    }
    const categoryId = categoryFind._id;

    // Increment category count
    await Category.findOneAndUpdate({ _id: categoryId }, { $inc: { count: 1 } });

    // Generate product ID
    const productId = await generateProductId();

    // Create new product with form data
    const newProduct = new Product({
      name,
      productId,
      category: categoryId,
      description,
      brand,
      salePrice: basePrice,    // Matches 'basePrice' from form
      productOffer: discount,   // Matches 'discount' from form
      quantity: stock,          // Matches 'stock' from form
      productImage: imageUrls,  // Matches 'variantImages' from form
    });

    // Save product to database
    await newProduct.save();

    // Send response matching frontend expectations
    res.status(200).json({ 
      success: true,
      message: "Product added successfully",
      redirect: "/admin/products"  // Changed 'location' to 'redirect' to match frontend
    });
    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error saving product",
      error: error.message 
    });
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

const loadProductsEditPage = async (req, res) => {
  try {
    console.log("edit age loaded");

    const { id } = req.params;

    const product = await Product.findOne({ _id: id });
    if (!product) {
      return res.status(404).send("Product not found");
    }
    const cat = await Category.find();
    res.render("admin/productsEdit", { product, cat });
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading product");
  }
};

// const updateProduct = async (req, res) => {
//   try {
//     const { productId, name, category, brand, description, basePrice, discount, stock, existingImages } = req.body;
    
//     const newImages = req.files ? req.files.map(file => file.path) : [];

//     if (!productId) {
//       return res.status(400).json({ message: 'Product ID is required' });
//     }

//     const product = await Product.findOne({ productId });
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     // Use existingImages if provided, otherwise use current product images
//     const keptImages = existingImages ? [].concat(existingImages) : product.productImage;

//     // Combine kept images with new images
//     const updatedImages = [...keptImages, ...newImages];

//     // Update the product
//     const updatedProduct = await Product.findByIdAndUpdate(
//       product._id,
//       {
//         name,
//         category,
//         brand,
//         description,
//         salePrice: basePrice,
//         productOffer: discount,
//         quantity: stock,
//         productImage: updatedImages,
//       },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       message: 'Product updated successfully',
//       product: updatedProduct,
//     });
//   } catch (error) {
//     console.error('Error in updateProduct:', error.message);
//     res.status(500).json({
//       message: 'Server error while updating product',
//       error: error.message,
//     });
//   }
// };





export default {
  loadproductAddPage,
  loadProductsPage,
  loadProductsEditPage,
  addProduct,
  // updateProduct,
  productBlocked,
  productUnBlocked,
};
