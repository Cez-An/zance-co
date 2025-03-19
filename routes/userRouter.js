import express from "express";
import userController from "../controllers/user/userController.js";
import userAuth from "../middlewares/userAuth.js";
const router = express.Router();

router.get("/pagenotfound", userController.pageNotFound);

router.get("/",userController.loadHomepage);

// signup route
router.route("/signup")
  .get(userController.loadSignUp)
  .post(userController.signup);

//login route
router.route("/login")
.get(userController.loadLogin)
.post(userController.login);

//otp varification route
router.route("/verifyOtp")
  .get(userController.loadOtpVerification)
  .post(userController.otpVerification);

// resend otp route
router.post("/resendOtp", userController.resendOtp);

//log out route
router.get("/logout", userController.logout);

//products details page
router.get("/loadProductsDetailsPage", userController.loadProductsDetails);

// forgot password
router.get('/forgotPassword',userController.loadForgotPassword)
router.post('/forgotPassword',userController.validateEmail)
router.get('/forgotPasswordOtp',userController.loadForgotPasswordOtp)




export default router;
