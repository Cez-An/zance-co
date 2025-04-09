import express from "express";
import userController from "../controllers/user/userController.js";
import userAuth from "../middlewares/userAuth.js";
import profileController from '../controllers/user/profileController.js'
import uploads from '../helpers/multer.js'

const router = express.Router();

router.get("/pagenotfound", userController.pageNotFound);

router.get("/",userController.loadHomepage);

router.get('/renderShopPage',userController.renderShopPage)

router.get("/testing",userController.testing);


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
router.get("/loadProductsDetailsPage/:id", userController.loadProductsDetails);

// forgot password
router.get('/forgotPassword',userController.loadForgotPassword)
router.post('/forgotPassword',userController.validateUserEmail)
router.get('/forgotPasswordOtp',userController.loadForgotPasswordOtp)
router.post('/forgotPasswordOtp',userController.FPotpVarification)
router.get('/newPassword',userController.renderNewPassPage)
router.post('/changePassword',userController.newPassword)

//user profile
router.get('/userProfile',profileController.renderProfileInfo)
router.get('/userProfile/:id',profileController.renderProfileEdit)
router.put('/userProfile', uploads.single('profilePic'), profileController.updateProfile)
router.post('/sendotp', profileController.sendOTP);
router.post('/verifymail', profileController.verifyOTP);

//address management
router.get('/address',profileController.loadAddress);
router.post('/address',profileController.addAddress);
router.get('/addAddress',profileController.loadAddAddress);
router.get('/editaddress', profileController.loadEditAddress);
router.put('/address', profileController.editAddress);
router.delete('/address', profileController.deleteAddress);
// router.get('/coupons', profileController.loadCoupons);
// router.get('/privacy', profileController.loadPrivacy);
// router.post('/privacy', profileController.updatePassword);


export default router;
