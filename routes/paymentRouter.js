import express from 'express';
import paymentController from '../controllers/user/paymentController.js';
const router = express.Router();

router.get('/', paymentController.loadPayments);
router.post('/', paymentController.paymentSuccess); 
router.post('/create-razorpay-order', paymentController.createRazorpayOrder);
router.post('/payment-failed', paymentController.paymentFailed);
router.get('/confirmOrder', paymentController.confirmOrder);
router.post('/retry', paymentController.retryRazorpayPayment); 


export default router;