import Product from "../../models/productsShema.js";
import User from "../../models/userSchema.js";
import Category from "../../models/categorySchema.js";
import cloudinary from '../../helpers/cloudinary.js'
import fs from 'fs';

const renderProductAddPage = async (req, res) => {
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

const renderProductsListPage = async (req, res) => {
  try {
    let search = "";

    if (req.query.search) {
      search = req.query.search;
    }

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
    const {
      name,
      description,
      category,
      basePrice,
      discount,
      stock,
      brand,
      visibilityStatus,
    } = req.body;

    let status = visibilityStatus === "Active" ? false : true;

    if (!req.files || !req.files.variantImages) {
      return res.status(400).json({
        success: false,
        message: "No images provided"
      });
    }

    const files = Array.isArray(req.files.variantImages)
      ? req.files.variantImages
      : [req.files.variantImages];

    const imageUrls = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "products"
      });
      imageUrls.push(result.secure_url);
      fs.unlinkSync(file.tempFilePath); // Clean up the temp file
    }

    const generateProductId = async () => {
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      const id = `ZNCP${randomNumber}`;
      const ifExists = await Product.findOne({ productId: id });
      return ifExists ? generateProductId() : id;
    };

    const categoryFind = await Category.findOne({ name: category });
    if (!categoryFind) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    const categoryId = categoryFind._id;
    await Category.findOneAndUpdate({ _id: categoryId }, { $inc: { count: 1 } });

    const productId = await generateProductId();

    const newProduct = new Product({
      name,
      productId,
      category: categoryId,
      description,
      brand,
      salePrice: basePrice,
      productOffer: discount,
      quantity: stock,
      isBlocked: status,
      productImage: imageUrls,
    });

    await newProduct.save();

    res.status(200).json({
      success: true,
      message: "Product added successfully",
      redirect: "/admin/products"
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
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.json({ success: true, isBlocked: true });

  } catch (error) {
    console.error("Error blocking product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const productUnBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.json({ success: true, isBlocked: false });

  } catch (error) {
    console.error("Error unblocking product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const renderProductsEditPage = async (req, res) => {
  try {

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

const updateProduct = async (req, res) => {
  try {
    
    const { id } = req.params;
    const {
      name,
      description,
      category,
      basePrice,
      discount,
      stock,
      brand,
    } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    
    let imageSlots = existingProduct.productImage || ['', '', '', ''];

    // Handle file uploads (expecting variantImages like in addProduct)
    if (req.files && req.files.variantImages) {
      const files = Array.isArray(req.files.variantImages)
        ? req.files.variantImages
        : [req.files.variantImages];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'products',
        });
        imageSlots[i] = result.secure_url;
        fs.unlinkSync(file.tempFilePath); 
      }
    }

    
    if (imageSlots.length !== 4 || imageSlots.some(url => !url)) {
      return res.status(400).json({
        success: false,
        message: 'Exactly four images are required',
      });
    }

    
    const categoryFind = await Category.findById(category);
    if (!categoryFind) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    
    if (existingProduct.category.toString() !== category) {
      await Category.findByIdAndUpdate(existingProduct.category, { $inc: { count: -1 } });
      await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category,
        brand,
        salePrice: basePrice,
        productOffer: discount,
        quantity: stock,
        productImage: imageSlots,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      redirect: '/admin/products',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product: ' + error.message,
    });
  }
};

export default {
  renderProductAddPage,
  renderProductsListPage,
  renderProductsEditPage,
  addProduct,
  updateProduct,
  productBlocked,
  productUnBlocked,
};