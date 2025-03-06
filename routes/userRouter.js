import express from 'express'
import userController from '../controllers/user/userController.js';

const router = express.Router();

router.get('/pageNotFound',userController.pageNotFound);

router.get('/',userController.loadHomepage)
router.get('/signup',userController.loadSignUp)
router.get('/login',userController.loadLogin)
router.get('/verifyOtp',userController.loadOtpVerification)

router.post('/signup',userController.signup)
router.post('/login',userController.login)
router.post('/verifyOtp',userController.otpVerification)


export default router;