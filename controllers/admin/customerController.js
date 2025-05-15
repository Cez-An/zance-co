import { renderFile } from "ejs";
import User from "../../models/userSchema.js";
import STATUS_CODE from "../../helpers/statusCode.js";

const renderCustomerInfo = async (req, res) => {
  try {
    let search = "";

    if (req.query.search) {
      search = req.query.search;
    }

    let page = parseInt(req.query.page) || 1; 

    const limit = 8;

    const userData = await User.find({
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalUsers = await User.countDocuments({
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ]
    });

    let totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/customers", {
      user: userData,
      totalPages:totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error-admin");
  }
};

const customerBlocked = async (req, res) => { 
  try {
    let {param:id} = req.body;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } }); 
    req.session.user = false;   
    return res.status(STATUS_CODE.SUCCESS).json({message:"User Blocked Successfully"});
  } catch (error) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({error:'User not blocked'})
  }
};

const customerUnBlocked = async (req, res) => {
  try {
    let {param2} = req.body;
    await User.updateOne({ _id: param2 }, { $set: { isBlocked: false } });
    return res.status(STATUS_CODE.SUCCESS).json({message:'User unblocked Successfuly'})
  } catch (error) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({error:'User not unblocked'})
  }
};

export default { renderCustomerInfo, customerBlocked, customerUnBlocked };
