import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Admin from "../../models/adminSchema.js";
import bcrypt from "bcrypt";
import User from "../../models/userSchema.js";

const renderAdminLoginPage = (req, res) => {
  try {
    console.log(`Rendering Admin Login Page
      `);

    if (req.session.admin) {
      return res.status(302).redirect("/admin/dashboard");
    }
    res.status(200).render("admin/login", { message: null });
    
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).render("partials/admin/404.ejs", {
      statuscode: "",
      errorname: "",
      message: "Something went wrong! Please try again later.",
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    console.log(`Login POST req accessed
      `);

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.warn(`Login failed: Invalid credentials for email - ${email}`);
      return res.status(STATUS_CODE.UNAUTHORIZED).render("admin/login", {
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      console.warn(`Login failed: Incorrect password for email - ${email}`);
      return res.status(STATUS_CODE.UNAUTHORIZED).render("admin/login", {
        message: "Invalid email or password",
      });
    }

    req.session.admin = { id: admin._id, email: admin.email };

    console.info(`Admin logged in successfully: ${email}
      `);

    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Admin login error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .render("admin/error-admin");
  }
};

const renderDashboard = (req, res) => {
  try {
    console.log(`Rendering Dashboard Page
      `);
    res.status(STATUS_CODE.SUCCESS).render("admin/dashboard.ejs");
  } catch (error) {
    console.error("Error occurred while loading the dashboard:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("admin/error-admin");
  }
};

const logout = (req, res) => {
  try {
    console.log(`Logout button clicked
      `);

    req.session.destroy();
    res.status(STATUS_CODE.SUCCESS).redirect("/admin/login");

  } catch (error) {
    console.error("Unexpected error during logout:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("admin/error-admin");
  }
};


export default { renderAdminLoginPage, adminLogin, renderDashboard, logout };
