import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Admin from "../../models/adminSchema.js";
import bcrypt from "bcrypt";
import User from "../../models/userSchema.js";
import Order from "../../models/orderSchema.js";
import Address from "../../models/addressSchema.js";
import Refund from "../../models/refundSchema.js";

const renderAdminLoginPage = (req, res) => {
  try {

    if (req.session.admin) {
      return res.status(STATUS_CODE.FOUND).redirect("/admin/dashboard");
    }
    res.status(STATUS_CODE.SUCCESS).render("admin/login", { message: null });
    
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("partials/admin/404.ejs", {
      statuscode: "",
      errorname: "",
      message: "Something went wrong! Please try again later.",
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      console.warn(`Login failed for email: ${email}`);
      return res.status(STATUS_CODE.UNAUTHORIZED).render("admin/login", {
        message: "Invalid email or password",
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).render("admin/login", {
          message: "Session error. Please try again.",
        });
      }

      req.session.admin = { id: admin._id, email: admin.email };
      console.info(`Admin logged in successfully: ${email}`);
      return res.redirect("/admin/dashboard");
    });

  } catch (error) {
    console.error("Admin login error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .render("partials/404");
  }
};

const renderDashboard = (req, res) => {
  try {
    console.log(`Admin Logged in`);
    res.status(STATUS_CODE.SUCCESS).render("admin/dashboard.ejs");
  } catch (error) {
    console.error("Error occurred while loading the dashboard:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("/pagenotfound");
  }
};

const logout = (req, res) => {
  try {

    req.session.destroy();
    res.status(STATUS_CODE.SUCCESS).redirect("/admin/login");

  } catch (error) {
    console.error("Unexpected error during logout:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("/pagenotfound");
  }
};

export default { renderAdminLoginPage, adminLogin, renderDashboard, logout,};