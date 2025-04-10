import express from "express";
const router = express.Router();
import adminController from '../controllers/admin/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'
import customerController from '../controllers/admin/customerController.js'
import categoryController from '../controllers/admin/categoryController.js'
import productController from "../controllers/admin/productController.js";
import uploads from '../helpers/multer.js'

// Admin login management
router.get('/login',adminAuth.islogin,adminController.renderAdminLoginPage)
router.get('/dashboard',adminAuth.checkSession,adminController.renderDashboard)
router.get('/logout',adminController.logout)
router.post('/login',adminController.adminLogin)


// customer management
router.get('/customers',adminAuth.checkSession,customerController.renderCustomerInfo);
router.post('/blockCustomer',adminAuth.checkSession,customerController.customerBlocked)
router.post('/unBlockCustomer',adminAuth.checkSession,customerController.customerUnBlocked)

//category Management
router.get('/category',adminAuth.checkSession,categoryController.renderCategoryInfo)
router.post('/category',adminAuth.checkSession,categoryController.addCategory)
router.put('/category/',adminAuth.checkSession,categoryController.updateCategory)
router.get('/categoryAdd',adminAuth.checkSession,categoryController.renderCategoryAdd)
router.get('/category/:id',adminAuth.checkSession,categoryController.renderCategoryEdit)

//product Management

router.get('/products',adminAuth.checkSession,productController.renderProductsListPage)
router.post('/products',uploads.array('variantImages',8),productController.addProduct)
router.put('/products/:id',uploads.array('variantImages',8),productController.updateProduct);

router.get('/productAdd',adminAuth.checkSession,productController.renderProductAddPage)
router.get('/products/:id',adminAuth.checkSession,productController.renderProductsEditPage)
router.get('/blockProduct',adminAuth.checkSession,productController.productBlocked)
router.get('/unBlockProduct',adminAuth.checkSession,productController.productUnBlocked)


export default router;