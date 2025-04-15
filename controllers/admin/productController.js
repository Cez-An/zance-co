import Product from "../../models/productsShema.js";
import User from "../../models/userSchema.js";
import Category from "../../models/categorySchema.js";


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
    
    let status;
    if (visibilityStatus === "Active") {
       status = false;
    } else {
       status = true;
    }
    
    const imageUrls = req.files.map((file) => file.path || file.url);

    const generateProductId = async () => {
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      const id = `ZNCP${randomNumber}`;
      const ifExists = await Product.findOne({ productId: id });
      if (ifExists) {
        return generateProductId();
      }
      return id;
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
      isBlocked:status,
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
      visibilityStatus,
      brand,
    } = req.body;

    // Set status based on visibilityStatus
    let status = visibilityStatus === 'Active' ? false : true;

    // Find the existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Initialize imageUrls with existing images (Cloudinary URLs)
    let imageUrls = existingProduct.productImage || ['', '', '', '']; // Ensure 4 slots, empty if missing

    // Handle new image uploads from Cloudinary
    if (req.files && req.files.length > 0) {
      // Map uploaded files to their slots
      req.files.forEach((file) => {
        // Extract slot index from fieldname (e.g., variantImages[0])
        const match = file.fieldname.match(/variantImages\[(\d)\]/);
        if (match) {
          const slot = parseInt(match[1]);
          if (slot >= 0 && slot < 4) {
            imageUrls[slot] = file.path; // Cloudinary URL
          }
        }
      });
    }

    // Ensure exactly 4 images
    if (imageUrls.length !== 4 || imageUrls.some(url => !url)) {
      return res.status(400).json({
        success: false,
        message: 'Exactly four images are required',
      });
    }

    // Validate category
    const categoryFind = await Category.findById(category);
    if (!categoryFind) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Update category count if changed
    if (existingProduct.category.toString() !== category) {
      await Category.findByIdAndUpdate(existingProduct.category, { $inc: { count: -1 } });
      await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category,
        brand,
        salePrice: basePrice,
        productOffer: discount,
        isBlocked: status,
        quantity: stock,
        productImage: imageUrls,
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
