import { renderFile } from "ejs";
import User from "../../models/userSchema.js";

const customerInfo = async (req, res) => {
  try {
    let search = "";

    if (req.query.search) {
      search = req.query.search;
    }

    let page = parseInt(req.query.page) || 1; // Ensure page is a number BUG

    const limit = 10;

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
    let id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/customers");
  } catch (error) {
    res.redirect("/error-admin");
  }
};

const customerUnBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/customers");
  } catch (error) {
    res.redirect("/error-admin");
  }
};

export default { customerInfo, customerBlocked, customerUnBlocked };
