import express from "express";
import userController from "../controllers/user/userController.js";
import userAuth from "../middlewares/userAuth.js";
import profileController from '../controllers/user/profileController.js'
import cartControlller from '../controllers/user/cartControlller.js'
import checkoutController from "../controllers/user/checkoutController.js";
import wishlistController from "../controllers/user/wishlistController.js"
import refundController from "../controllers/user/refundController.js"
import walletController from "../controllers/user/walletController.js"
import authController from "../controllers/user/authController.js";
import shopController from "../controllers/user/shopController.js";
import couponController from "../controllers/user/couponControler.js"

const router = express.Router();

// signup route
router.route("/signup")
  .get(authController.renderSignUp)
  .post(authController.signup);

//login route
router.route("/login")
.get(authController.renderLogin)
.post(authController.login);

//otp varification route
router.route("/verifyOtp")
  .get(authController.renderOtpVerification)
  .post(authController.otpVerification);

// resend otp route
router.post("/resendOtp", authController.resendOtp);

//log out route
router.get("/logout", userController.logout);

//home page
router.get("/",userController.renderHomepage);

//shop page
router.get('/renderShopPage',shopController.renderShopPage)

//products details page
router.get("/loadProductsDetailsPage/:id", userController.loadProductsDetails);

// forgot password
router.get('/forgotPassword',userController.loadForgotPassword)
router.post('/forgotPassword',authController.validateUserEmail)
router.get('/forgotPasswordOtp',userController.loadForgotPasswordOtp)
router.post('/forgotPasswordOtp',userController.FPotpVarification)
router.get('/newPassword',userController.renderNewPassPage)
router.post('/changePassword',userController.newPassword)

//user profile
router.get('/userProfile',userAuth.checkStatus,profileController.renderProfileInfo)
router.get('/userProfile/:id',userAuth.checkStatus,profileController.renderProfileEdit)
router.put('/userProfile', userAuth.checkStatus,profileController.updateProfile)
router.post('/sendotp', userAuth.checkStatus,profileController.sendOTP);
router.post('/verifymail', userAuth.checkStatus,profileController.verifyOTP);

//address management
router.get('/address',userAuth.checkStatus,profileController.loadAddress);
router.post('/address',userAuth.checkStatus,profileController.addAddress);
router.get('/addAddress',userAuth.checkStatus,profileController.loadAddAddress);
router.get('/editaddress', userAuth.checkStatus,profileController.loadEditAddress);
router.put('/address', userAuth.checkStatus,profileController.editAddress);
router.delete('/address', userAuth.checkStatus,profileController.deleteAddress);

//privacy settings
router.get('/privacy', userAuth.checkStatus,profileController.loadPrivacy);
router.post('/privacy', userAuth.checkStatus,profileController.updatePassword);

//cart routes
router.post('/cart', userAuth.checkStatus,cartControlller.addItemToCart);
router.get('/cart', userAuth.checkStatus,cartControlller.loadCart);
router.patch('/cart', userAuth.checkStatus,cartControlller.updateQuantity);
router.delete('/cart', userAuth.checkStatus,cartControlller.deleteFromcart);

// payment and checkout routes
router.get('/checkout', userAuth.checkStatus,checkoutController.loadCheckout);
router.post('/checkout', userAuth.checkStatus,checkoutController.checkoutDetails);
router.post('/shoppingAddress', userAuth.checkStatus,checkoutController.addShoppingAddress);
router.put('/shoppingAddress', userAuth.checkStatus,checkoutController.editshoppingAddress);
router.post('/select-address', userAuth.checkStatus,checkoutController.saveSelectedAddress);

// wishlist routes
router.get('/wishlist',userAuth.checkStatus, wishlistController.getWishlist);
router.post('/wishlist', userAuth.checkStatus,wishlistController.toggleWishlist);
router.delete('/wishlist', userAuth.checkStatus,wishlistController.removeFromWishlist);
router.post('/wishlist-to-cart',userAuth.checkStatus,wishlistController.wishlistToCart)

//order Routes
router.get('/order', userAuth.checkStatus,profileController.loadOrders);
router.get('/orderDetails', userAuth.checkStatus,profileController.loadOrderDetails);
router.post('/order/return', userAuth.checkStatus,refundController.requestRefund);
router.patch('/order/cancel', userAuth.checkStatus,refundController.cancelOrder);
router.get('/order/invoiceDownload',userAuth.checkStatus,profileController.downloadOrderInvoice);

//wallet
router.get('/wallet', userAuth.checkStatus,walletController.loadWallet);

//coupon
router.post('/couponValidate', userAuth.checkStatus,couponController.validateCoupon);

router.get("/pagenotfound", userController.pageNotFound);

export default router;