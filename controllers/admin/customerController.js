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
    res.redirect("/pagenotfound");
  }
};


const customerBlocked = async (req, res) => { 
  try {
    const id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    return res.json({ success: true, isBlocked: true });

  } catch (error) {

    console.error("Block error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'User not blocked' });
  }
};


const customerUnBlocked = async (req, res) => {
  try {
    const id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    return res.json({ success: true, isBlocked: false });

  } catch (error) {

    console.error("Unblock error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'User not unblocked' });
  }
};

export default { renderCustomerInfo, customerBlocked, customerUnBlocked };