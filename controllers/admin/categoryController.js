import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Product from "../../models/productsShema.js"
import Order from "../../models/orderSchema.js";

const renderCategoryInfo = async (req, res) => {
  try {
    let search = req.query.search ? req.query.search.trim() : "";

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    });

    const totalPages = Math.ceil(totalCategories / limit);

    res.status(STATUS_CODE.SUCCESS).render("admin/category", {
      categoryData,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error loading category information:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).redirect("/pagenotfound"); // Internal Server Error
  }
};

const addCategory = async (req, res) => {

  const { name, visibilityStatus, categoryDiscount } = req.body;

  try {
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(name, 'i') } });

    if (existingCategory) {
      return res.render("admin/categoryAdd", {
        message: "Category Already Exists",
      });
    }
    let status;

    if (visibilityStatus === "Active") {
       status = true;
    } else {
       status = false;
    }

    const newCategory = new Category({
      name,
      isListed: status,
      discount: categoryDiscount,
    });

    await newCategory.save();

    return res.redirect("/admin/category");
  } catch (error) {
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};

const renderCategoryAdd = async (req, res) => {
  try {
    res.render("admin/categoryAdd",{message:''});
  } catch (error) {
    res.redirect("/pagenotfound");
  }
};

const renderCategoryEdit = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findOne({ _id: id });

    res.render("admin/categoryEdit", { category });
  } catch (error) {
    res.redirect("/pagenotfound");
  }
};

const updateCategory = async (req, res) => {
  try {
    let { categoryName, visibilityStatus, categoryDiscount, categoryId } = req.body;

    visibilityStatus = visibilityStatus === "Active";

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(categoryName, 'i') },
      _id: { $ne: categoryId }, 
    });

    if (existingCategory) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "Category Already Exists" });
    }

    const category = await Category.findById(categoryId);
    if (!category) return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Category not found" });

    category.name = categoryName;
    category.isListed = visibilityStatus;
    category.discount = categoryDiscount;
    await category.save();

     const products = await Product.find({ category: categoryId });

      for (const product of products) {
      const productOffer = product.productOffer || 0;
      const offerPercentage = Math.max(productOffer, categoryDiscount);
      const offerPrice = Math.floor(product.salePrice - (product.salePrice * offerPercentage) / 100);

      product.offerPrice = offerPrice;
      await product.save();
    }

    res.status(STATUS_CODE.SUCCESS).json({ message: "Category updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};


export default {
  renderCategoryInfo,
  addCategory,
  renderCategoryAdd,
  renderCategoryEdit,
  updateCategory,
};