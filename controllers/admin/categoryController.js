import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";



const categoryInfo = async (req, res) => {
  try {
    let search = '';

        if(req.query.search){
            console.log(search);
            
            search = req.query.search;
        }
      console.log('Accessed categoryInfo');
      
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({name:{$regex:'.*'+search+".*",$options:'i'}})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = Category.find({name:{$regex:'.*'+search+".*",$options:'i'}}).countDocuments();
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

  console.log('accessed add category');
  
  const { name, visibilityStatus, categoryDiscount } = req.body;
  console.log(req.body);
  
  try {

    const existingcategory = await Category.findOne({ name });
    console.log(existingcategory);

    if (existingcategory) {

      return res.render('admin/categoryAdd',{message:'Category Already Exists'})
        
    }
    let status;

    if(visibilityStatus==='Active'){
      let status = true;

    }else{
      let status = false;
    }

    const newCategory = new Category({
      name,
      isListed:status,
      discount:categoryDiscount,
    });

    await newCategory.save();
    console.log(newCategory);
    
    return res.redirect('/admin/category')

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



const loadCategoryEdit = async(req,res)=>{
  try {
    const id = req.params.id;
    const category = await Category.findOne({_id:id});
    console.log(category);
    
    res.render('admin/categoryEdit',{category})
  } catch (error) {
    res.redirect('/error');
  }
}



const updateCategory = async(req,res)=>{
  try {
    
    let {categoryName,visibilityStatus,categoryDiscount,categoryId} =req.body;
    console.log(categoryId);
    if(visibilityStatus==='Active'){
      visibilityStatus = true;
    }else{
      visibilityStatus = false;
    }

    const category = await Category.findById({_id:categoryId})
    category.name = categoryName;
    category.isListed = visibilityStatus;
    category.discount = categoryDiscount;

    await category.save();
    res.status(STATUS_CODE.SUCCESS).json({message:'done'})
  } catch (error) {
    res.redirect('/error')
  }
}

export default { categoryInfo, addCategory, loadCategoryAdd, loadCategoryEdit, updateCategory };
