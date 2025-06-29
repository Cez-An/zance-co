import express from "express";
import adminController from '../controllers/admin/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'
import customerController from '../controllers/admin/customerController.js'
import categoryController from '../controllers/admin/categoryController.js'
import productController from "../controllers/admin/productController.js";
import orderController from "../controllers/admin/orderController.js"
import refundController from "../controllers/user/refundController.js";
import couponController from "../controllers/admin/couponController.js"
import salesController from "../controllers/admin/salesController.js";
import dashboardController from "../controllers/admin/dashboardController.js"

const router = express.Router();

// Admin login management
router.get('/login',adminAuth.islogin,adminController.renderAdminLoginPage)
router.get('/dashboard',adminAuth.checkSession,adminController.renderDashboard)
router.get('/dashboard/data',adminAuth.checkSession,dashboardController.renderDashboardStats)
router.get('/logout',adminController.logout)
router.post('/login',adminController.adminLogin)

// customer management
router.get('/customers',adminAuth.checkSession,customerController.renderCustomerInfo);
router.post('/blockCustomer',adminAuth.checkSession,customerController.customerBlocked)
router.post('/unBlockCustomer',adminAuth.checkSession,customerController.customerUnBlocked)

// category Management
router.route('/category')
  .get(adminAuth.checkSession, categoryController.renderCategoryInfo)
  .post(adminAuth.checkSession, categoryController.addCategory);

router.put('/category/',adminAuth.checkSession,categoryController.updateCategory)
router.get('/categoryAdd',adminAuth.checkSession,categoryController.renderCategoryAdd)
router.get('/category/:id',adminAuth.checkSession,categoryController.renderCategoryEdit)

// product Management
router.route('/products')
  .get(adminAuth.checkSession, productController.renderProductsListPage)
  .post(adminAuth.checkSession, productController.addProduct);

router.put('/products/:id',adminAuth.checkSession,productController.updateProduct);
router.get('/productAdd',adminAuth.checkSession,productController.renderProductAddPage)
router.get('/products/:id',adminAuth.checkSession,productController.renderProductsEditPage)
router.post('/blockProduct',adminAuth.checkSession,productController.productBlocked)
router.post('/unBlockProduct',adminAuth.checkSession,productController.productUnBlocked)

// order
router.route('/orders')
  .get(adminAuth.checkSession, orderController.loadOrders)
  .patch(adminAuth.checkSession, orderController.updateStatus);

router.patch('/orders/all-status',adminAuth.checkSession, orderController.updateAllOrderItemsStatus);
router.get('/vieworders', adminAuth.checkSession, orderController.viewOrders);

// refund
router.patch('/refunds',adminAuth.checkSession, refundController.updateRefundStatus);

// coupon management
router.route('/coupons')
  .get(adminAuth.checkSession, couponController.loadCouponPage)
  .post(adminAuth.checkSession, couponController.addCoupon)
  .put(adminAuth.checkSession, couponController.editCoupon)
  .delete(adminAuth.checkSession, couponController.deleteCoupon);


// sales report
router.get('/sales',adminAuth.checkSession, salesController.loadSalesReport);
router.get('/sales/download/pdf',adminAuth.checkSession, salesController.generateSalesReportPDF);
router.get('/sales/download/excel',adminAuth.checkSession, salesController.downloadSalesReportExcel);

export default router;