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
router.get('/dashboard',adminAuth.checkSession,adminController.loadDashboard)
router.get('/logout',adminController.logout)
router.post('/login',adminController.adminLogin)



// customer management
router.get('/customers',adminAuth.checkSession,customerController.customerInfo);
// router.get('/blockCustomer',adminAuth.checkSession,customerController.customerBlocked) fetch implemented
router.post('/blockCustomer',adminAuth.checkSession,customerController.customerBlocked)
router.get('/unBlockCustomer',adminAuth.checkSession,customerController.customerUnBlocked)

//category Management
router.get('/category',adminAuth.checkSession,categoryController.categoryInfo)
router.get('/categoryAdd',adminAuth.checkSession,categoryController.loadCategoryAdd)
router.get('/categoryEdit/:id',adminAuth.checkSession,categoryController.loadCategoryEdit)  // remove Edit
router.post('/category',adminAuth.checkSession,categoryController.addCategory)
router.put('/category/',adminAuth.checkSession,categoryController.updateCategory)
router.delete('/category/',adminAuth.checkSession,categoryController.deleteCategory)

//product Management
router.get('/products',adminAuth.checkSession,productController.loadProductsPage)
router.get('/productAdd',adminAuth.checkSession,productController.loadproductAddPage)
router.post('/products',uploads.array('variantImages',8),productController.addProduct)
router.get('/blockProduct',adminAuth.checkSession,productController.productBlocked)
router.get('/unBlockProduct',adminAuth.checkSession,productController.productUnBlocked)


export default router;