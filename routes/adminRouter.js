import express from "express";
const router = express.Router();
import adminController from '../controllers/admin/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'
import customerController from '../controllers/admin/customerController.js'
import categoryController from '../controllers/admin/categoryController.js'

// Admin login management
router.get('/login',adminController.LoadAdminLogin)
router.get('/dashboard',adminAuth,adminController.loadDashboard)
router.get('/logout',adminController.logout)

// customer management
router.get('/customers',adminAuth,customerController.customerInfo);
router.get('/blockCustomer',adminAuth,customerController.customerBlocked)
router.get('/unBlockCustomer',adminAuth,customerController.customerUnBlocked)

//category Management
router.get('/category',adminAuth,categoryController.categoryInfo)
router.get('/categoryAdd',adminAuth,categoryController.loadCategoryAdd)
router.post('/category',adminAuth,categoryController.addCategory)

//post methods
router.post('/login',adminController.login)


export default router;