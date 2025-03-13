import STATUS_CODE from "../helpers/statusCode.js";
import Admin from "../models/adminSchema.js";


const adminAuth = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ isAdmin: true });
    if (admin) {
      return next();
    } else {
      return res.redirect("/admin/login");
    }
  } catch (error) {
    console.error("Error in adminAuth Middleware", error);
    res.redirect('/error');
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

export default adminAuth;
