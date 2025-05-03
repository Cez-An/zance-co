import Product from "../../models/productsShema.js";
import User from "../../models/userSchema.js";
import Category from "../../models/categorySchema.js";
import cloudinary from '../../helpers/cloudinary.js'
import fs from 'fs';

const renderProductAddPage = async (req, res) => {
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

const renderProductsListPage = async (req, res) => {
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

const renderProductsEditPage = async (req, res) => {
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
//     const { id } = req.params;
//     const { 
//       name, 
//       description, 
//       category, 
//       basePrice, 
//       discount, 
//       stock, 
//       brand 
//     } = req.body;

//     // Find existing product
//     const existingProduct = await Product.findById(id);
//     if (!existingProduct) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found"
//       });
//     }

//     // Get new image URLs if uploaded, otherwise keep existing ones
//     let imageUrls = existingProduct.productImage;
//     if (req.files && req.files.length > 0) {
//       imageUrls = req.files.map((file) => file.path || file.url);
//       // Ensure we have exactly 4 images by filling with existing ones if needed
//       for (let i = imageUrls.length; i < 4; i++) {
//         if (existingProduct.productImage[i]) {
//           imageUrls.push(existingProduct.productImage[i]);
//         }
//       }
//       // Trim to 4 images if more are uploaded
//       imageUrls = imageUrls.slice(0, 4);
//     }

//     // Find category by ID
//     const categoryFind = await Category.findById(category);
//     if (!categoryFind) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Invalid category" 
//       });
//     }

//     // Update category count if category changed
//     if (existingProduct.category.toString() !== category) {
//       await Category.findByIdAndUpdate(existingProduct.category, { $inc: { count: -1 } });
//       await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });
//     }

//     // Update product
//     const updatedProduct = await Product.findByIdAndUpdate(
//       id,
//       {
//         name,
//         description,
//         category,
//         brand,
//         salePrice: basePrice,
//         productOffer: discount,
//         quantity: stock,
//         productImage: imageUrls,
//       },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({ 
//       success: true,
//       message: "Product updated successfully",
//       redirect: "/admin/products"
//     });
    
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Error updating product",
//       error: error.message 
//     });
//   }
// };

// const updateProduct = async (req, res) => {
//   try {
//       const { id } = req.params;
//       const { 
//           name, 
//           description, 
//           category, 
//           basePrice, 
//           discount, 
//           stock, 
//           visibilityStatus,
//           brand 
//       } = req.body;

       
//     let status;
//     if (visibilityStatus === "Active") {
//        status = false;
//     } else {
//        status = true;
//     }
    

//       const existingProduct = await Product.findById(id);
//       if (!existingProduct) {
//           return res.status(404).json({
//               success: false,
//               message: "Product not found"
//           });
//       }

//       let imageUrls = existingProduct.productImage || [];
//       if (req.files && req.files.length > 0) {
//           imageUrls = req.files.map((file) => file.path || file.url);
//           while (imageUrls.length < 4 && existingProduct.productImage.length > imageUrls.length) {
//               imageUrls.push(existingProduct.productImage[imageUrls.length]);
//           }
//           imageUrls = imageUrls.slice(0, 4);
//       }

//       const categoryFind = await Category.findById(category);
//       if (!categoryFind) {
//           return res.status(400).json({ 
//               success: false,
//               message: "Invalid category" 
//           });
//       }

//       if (existingProduct.category.toString() !== category) {
//           await Category.findByIdAndUpdate(existingProduct.category, { $inc: { count: -1 } });
//           await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });
//       }
  
//       const updatedProduct = await Product.findByIdAndUpdate(
//           id,
//           {
//               name,
//               description,
//               category,
//               brand,
//               salePrice: basePrice,
//               productOffer: discount,
//               isBlocked:status,
//               quantity: stock,
//               productImage: imageUrls,
//           },
//           { new: true, runValidators: true }
//       );

//       res.status(200).json({ 
//           success: true,
//           message: "Product updated successfully",
//           redirect: "/admin/products"
//       });
      
//   } catch (error) {
//       console.error("Error updating product:", error);
//       res.status(500).json({ 
//           success: false,
//           message: "Error updating product: " + error.message
//       });
//   }
// };

// const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       name,
//       description,
//       category,
//       basePrice,
//       discount,
//       stock,
//       visibilityStatus,
//       brand,
//     } = req.body;

//     let status = visibilityStatus === 'Active' ? false : true;
    
//     const existingProduct = await Product.findById(id);
//     if (!existingProduct) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found',
//       });
//     }

//     let imageUrls = existingProduct.productImage || ['', '', '', '']; 
  
//     if (req.files && req.files.length > 0) {
      
//       req.files.forEach((file) => {
       
//         const match = file.fieldname.match(/variantImages\[(\d)\]/);
//         if (match) {
//           const slot = parseInt(match[1]);
//           if (slot >= 0 && slot < 4) {
//             imageUrls[slot] = file.path; 
//           }
//         }
//       });
//     }

//     if (imageUrls.length !== 4 || imageUrls.some(url => !url)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Exactly four images are required',
//       });
//     }

//     const categoryFind = await Category.findById(category);
//     if (!categoryFind) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid category',
//       });
//     }

//     if (existingProduct.category.toString() !== category) {
//       await Category.findByIdAndUpdate(existingProduct.category, { $inc: { count: -1 } });
//       await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });
//     }

//     const updatedProduct = await Product.findByIdAndUpdate(
//       id,
//       {
//         name,
//         description,
//         category,
//         brand,
//         salePrice: basePrice,
//         productOffer: discount,
//         isBlocked: status,
//         quantity: stock,
//         productImage: imageUrls,
//       },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Product updated successfully',
//       redirect: '/admin/products',
//     });
//   } catch (error) {
//     console.error('Error updating product:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating product: ' + error.message,
//     });
//   }
// };

// const updateProduct = async (req, res) => {
//   try {
//     console.log("ACCCCCCEDED UPDATE PRODUCT");
    
//     const { id } = req.params;
//     const {
//       name,
//       description,
//       category,
//       basePrice,
//       discount,
//       stock,
//       brand,
//     } = req.body;


//     const existingProduct = await Product.findById(id);
//     if (!existingProduct) {
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     // Start with existing images
//     let imageSlots = existingProduct.productImage || ['', '', '', ''];

//     // Handle file uploads (express-fileupload)
//     if (req.files) {
//       const files = Object.entries(req.files); // [['variantImages[0]', file], ['variantImages[2]', file], ...]

//       for (const [key, file] of files) {
//         const match = key.match(/variantImages\[(\d)\]/);
//         if (match) {
//           const slot = parseInt(match[1]);
//           if (slot >= 0 && slot < 4) {
//             // Upload new image to Cloudinary
//             const result = await cloudinary.uploader.upload(file.tempFilePath, {
//               folder: 'products',
//             });

//             // Store only the image URL
//             imageSlots[slot] = result.secure_url;

//             // Remove temp file
//             fs.unlinkSync(file.tempFilePath);
//           }
//         }
//       }
//     }

//     // Ensure exactly 4 valid image URLs
//     if (imageSlots.length !== 4 || imageSlots.some(url => !url)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Exactly four images are required',
//       });
//     }

//     // Validate category and adjust count if changed
//     const categoryFind = await Category.findById(category);
//     if (!categoryFind) {
//       return res.status(400).json({ success: false, message: 'Invalid category' });
//     }

//     if (existingProduct.category.toString() !== category) {
//       await Category.findByIdAndUpdate(existingProduct.category, { $inc: { count: -1 } });
//       await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });
//     }

//     const updatedProduct = await Product.findByIdAndUpdate(
//       id,
//       {
//         name,
//         description,
//         category,
//         brand,
//         salePrice: basePrice,
//         productOffer: discount,
//         quantity: stock,
//         productImage: imageSlots,
//       },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Product updated successfully',
//       redirect: '/admin/products',
//     });
//   } catch (error) {
//     console.error('Error updating product:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating product: ' + error.message,
//     });
//   }
// };

const updateProduct = async (req, res) => {
  try {
    console.log("ACCCCCCEDED UPDATE PRODUCT");

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
