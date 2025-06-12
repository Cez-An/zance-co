import express from "express";
import userController from "../controllers/user/userController.js";
import userAuth from "../middlewares/userAuth.js";
import profileController from '../controllers/user/profileController.js'
import orderController from "../controllers/user/orderController.js";
import cartControlller from '../controllers/user/cartControlller.js'
import checkoutController from "../controllers/user/checkoutController.js";
import wishlistController from "../controllers/user/wishlistController.js"
import refundController from "../controllers/user/refundController.js"
import walletController from "../controllers/user/walletController.js"
import authController from "../controllers/user/authController.js";
import shopController from "../controllers/user/shopController.js";
import couponController from "../controllers/user/couponControler.js"
import addressController from "../controllers/user/addressController.js"

const router = express.Router();

// signup route
router.route("/signup")
  .get(authController.renderSignUp)
  .post(authController.signup);

// login route
router.route("/login")
.get(authController.renderLogin)
.post(authController.login);

// otp varification route
router.route("/verifyOtp")
  .get(authController.renderOtpVerification)
  .post(authController.otpVerification);

// getting the time for the timer
router.get('/otp-timer',authController.getOtpExpiryTime);

// render varify otp
router.get('/verifyOtp',authController.renderotp )

// resend otp route
router.post("/resendOtp", authController.resendOtp);

// log out route
router.get("/logout", userController.logout);

// home page
router.get("/",userController.renderHomepage);

// shop page
router.get('/renderShopPage',shopController.renderShopPage)

// products details page
router.get("/loadProductsDetailsPage/:id", userController.loadProductsDetails);

// forgot password
router.route('/forgotPassword')
  .get(userController.loadForgotPassword)
  .post(authController.validateUserEmail);

router.route('/forgotPasswordOtp')
  .get(userController.loadForgotPasswordOtp)
  .post(userController.FPotpVarification);

router.get('/newPassword',userController.renderNewPassPage)
router.post('/changePassword',userController.newPassword)

// user profile
router.route('/userProfile')
  .get(userAuth.checkStatus, profileController.renderProfileInfo)
  .put(userAuth.checkStatus, profileController.updateProfile);

router.get('/userProfile/:id',userAuth.checkStatus,profileController.renderProfileEdit)
router.post('/sendotp', userAuth.checkStatus,profileController.sendOTP);
router.post('/verifymail', userAuth.checkStatus,profileController.verifyOTP);

// address management
router.route('/address')
  .get(userAuth.checkStatus, addressController.loadAddress)
  .post(userAuth.checkStatus, addressController.addAddress)
  .put(userAuth.checkStatus, addressController.editAddress)
  .delete(userAuth.checkStatus, addressController.deleteAddress);

router.get('/addAddress',userAuth.checkStatus,addressController.loadAddAddress);
router.get('/editaddress', userAuth.checkStatus,addressController.loadEditAddress);



// privacy settings
router.route('/privacy')
  .get(userAuth.checkStatus, profileController.loadPrivacy)
  .post(userAuth.checkStatus, profileController.updatePassword);


// cart routes
router.route('/cart')
  .post(userAuth.checkStatus, cartControlller.addItemToCart)
  .get(userAuth.checkStatus, cartControlller.loadCart)
  .patch(userAuth.checkStatus, cartControlller.updateQuantity)
  .delete(userAuth.checkStatus, cartControlller.deleteFromcart);


// payment and checkout routes
router.route('/checkout')
  .get(userAuth.checkStatus, checkoutController.loadCheckout)
  .post(userAuth.checkStatus, checkoutController.checkoutDetails);

router.route('/shoppingAddress')
  .post(userAuth.checkStatus, checkoutController.addShoppingAddress)
  .put(userAuth.checkStatus, checkoutController.editshoppingAddress);

router.post('/select-address', userAuth.checkStatus,checkoutController.saveSelectedAddress);

// wishlist routes
router.route('/wishlist')
  .get(userAuth.checkStatus, wishlistController.getWishlist)
  .post(userAuth.checkStatus, wishlistController.toggleWishlist)
  .delete(userAuth.checkStatus, wishlistController.removeFromWishlist);

router.post('/wishlist-to-cart',userAuth.checkStatus,wishlistController.wishlistToCart)

// order Routes
router.get('/order', userAuth.checkStatus,orderController.loadOrders);
router.get('/orderDetails', userAuth.checkStatus,orderController.loadOrderDetails);
router.post('/order/return', userAuth.checkStatus,refundController.requestRefund);
router.patch('/order/cancel', userAuth.checkStatus,refundController.cancelOrder);
router.get('/order/invoice',userAuth.checkStatus,orderController.downloadOrderInvoice);

// wallet
router.get('/wallet', userAuth.checkStatus,walletController.loadWallet);

// coupon
router.post('/couponValidate', userAuth.checkStatus,couponController.validateCoupon);

router.get("/pagenotfound", userController.pageNotFound);

router.get("/about",shopController.aboutpage)

router.get("/testing",shopController.testing)

export default router;