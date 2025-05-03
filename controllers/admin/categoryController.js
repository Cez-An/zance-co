import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Order from "../../models/orderSchema.js";





const renderCategoryInfo = async (req, res) => {
  try {
    let search = req.query.search ? req.query.search.trim() : "";
    console.log("Search Query:", search);
    console.log("Accessed categoryInfo");

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
    res.status(500).redirect("/error-admin"); // Internal Server Error
  }
};

const addCategory = async (req, res) => {
  console.log("accessed add category");

  const { name, visibilityStatus, categoryDiscount } = req.body;
  console.log(req.body);

  try {
    const existingcategory = await Category.findOne({ name });
    console.log(existingcategory);

    if (existingcategory) {
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
    console.log(newCategory);

    return res.redirect("/admin/category");
  } catch (error) {
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};

const renderCategoryAdd = async (req, res) => {
  try {
    res.render("admin/categoryAdd");
  } catch (error) {
    res.redirect("/error-admin");
  }
};

const renderCategoryEdit = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findOne({ _id: id });
    console.log(category);

    res.render("admin/categoryEdit", { category });
  } catch (error) {
    res.redirect("/error-admin");
  }
};

const updateCategory = async (req, res) => {
  try {
    let { categoryName, visibilityStatus, categoryDiscount, categoryId } =
      req.body;

    if (visibilityStatus === "Active") {
      visibilityStatus = true;
    } else {
      visibilityStatus = false;
    }

    const category = await Category.findById({ _id: categoryId });
    category.name = categoryName;
    category.isListed = visibilityStatus;
    category.discount = categoryDiscount;
    await category.save();
    res.status(STATUS_CODE.SUCCESS).json({ message: "done" });
  } catch (error) {
    return res.status(STATUS_CODE.NOT_FOUND);
  }
};

// const deleteCategory = async (req, res) => {
//   try {
//     const { id } = req.body;
//     const category = await Category.findByIdAndDelete(id);
//     return res
//       .status(STATUS_CODE.SUCCESS)
//       .json({ message: "Category deleted successfully" }); 
//   } catch (error) {
//     return res
//       .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
//       .json({ error: "Category deletion failed" });
//   }
// };

export default {
  renderCategoryInfo,
  addCategory,
  renderCategoryAdd,
  renderCategoryEdit,
  updateCategory,




  // deleteCategory,
};
