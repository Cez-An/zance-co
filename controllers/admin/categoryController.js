import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";



const categoryInfo = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    res.render("admin/category", {                                // category Page loading
      categoryData: categoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
    });

  } catch (error) {
    console.error(error);
    res.redirect("/error");
  }
};



const addCategory = async (req, res) => {
  const { name, description,visibilityStatus } = req.body;
  console.log(req.body);
  
  try {
    const existingcategory = await Category.findOne({ name });
    console.log(existingcategory);

    if (existingcategory) {

      return res.render('admin/category',{message:'Category Already Exists'})
        
    }

    const newCategory = new Category({
      name,
      description,
      isListed:visibilityStatus,
    });

    await newCategory.save();
    console.log(newCategory);
    
    return res.render('admin/category',{message:'Category saved succefully'})

  } catch (error) {
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};

const loadCategoryAdd = async(req,res)=>{
    try {

        res.render('admin/categoryAdd')
        
    } catch (error) {
        res.redirect('/error')
    }
}

export default { categoryInfo, addCategory, loadCategoryAdd };
