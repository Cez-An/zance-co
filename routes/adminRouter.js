import express from "express";
const router = express.Router();
import adminController from '../controllers/admin/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'
import customerController from '../controllers/admin/customerController.js'
import categoryController from '../controllers/admin/categoryController.js'
import productController from "../controllers/admin/productController.js";
import multer from 'multer'
import storage from '../helpers/multer.js'

const uploads = multer({storage:storage})

// Admin login management
router.get('/login',adminController.LoadAdminLogin)
router.get('/dashboard',adminAuth,adminController.loadDashboard)
router.get('/logout',adminController.logout)
router.post('/login',adminController.login)


// customer management
router.get('/customers',adminAuth,customerController.customerInfo);
router.get('/blockCustomer',adminAuth,customerController.customerBlocked)
router.get('/unBlockCustomer',adminAuth,customerController.customerUnBlocked)

//category Management
router.get('/category',adminAuth,categoryController.categoryInfo)
router.get('/categoryAdd',adminAuth,categoryController.loadCategoryAdd)
router.get('/categoryEdit/:id',adminAuth,categoryController.loadCategoryEdit)
router.post('/category',adminAuth,categoryController.addCategory)
router.put('/category/',adminAuth,categoryController.updateCategory)

//product Management
router.get('/products',adminAuth,productController.loadProductsPage)
router.get('/productAdd',adminAuth,productController.loadproductAddPage)
router.post('/products',adminAuth,uploads.array('variantImages[]',8),productController.addProduct)
router.get('/blockProduct',adminAuth,productController.productBlocked)
router.get('/unBlockProduct',adminAuth,productController.productUnBlocked)


export default router;