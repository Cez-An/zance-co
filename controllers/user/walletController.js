import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js"
import crypto from 'crypto';
import Razorpay from "razorpay"; 

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_API_KEY,
  key_secret: process.env.RAZOR_API_SECRET
});

const loadWallet = async(req, res) =>{
    try {
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;
        
        if(!userId){
            return res.status(STATUS_CODE.UNAUTHORIZED).json({message : 'Please login to continue..!'})
        }

        const user = await User.findOne({ _id : userId, isBlocked : false});


        res.render('user/myWallet', { user })
    } catch (error) {
        
    }
}


// Get wallet page data
// const getWalletPage = async (req, res) => {
//     try {
//         const userId = req.session.user?.id ?? req.session.user?._id ?? null;

//         if (!userId) {
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: 'User not authenticated' });
//         }

//         const user = await User.findById(userId);
        
//         if (!user) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'User not found' });
//         }

//         const walletData = {
//             balance: user.wallet,
//             history: user.walletHistory.sort((a, b) => new Date(b.date) - new Date(a.date)) // Latest first
//         };

//         res.render('user/wallet', { 
//             user: req.session.user,
//             wallet: walletData,
//             title: 'My Wallet'
//         });

//     } catch (error) {
//         console.error('Error loading wallet page:', error);
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render('error', { 
//             message: 'Failed to load wallet page' 
//         });
//     }
// };

// Get wallet data (API endpoint)
// const getWalletData = async (req, res) => {
//     try {
//         const userId = req.session.user?.id ?? req.session.user?._id ?? null;

//         if (!userId) {
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: 'User not authenticated' });
//         }

//         const user = await User.findById(userId);
        
//         if (!user) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'User not found' });
//         }

//         const walletData = {
//             balance: user.wallet,
//             history: user.walletHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
//         };

//         res.status(STATUS_CODE.SUCCESS).json({ wallet: walletData });

//     } catch (error) {
//         console.error('Error fetching wallet data:', error);
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch wallet data' });
//     }
// };

// Create Razorpay order for wallet top-up
// const createWalletTopUpOrder = async (req, res) => {
//     try {
//         const userId = req.session.user?.id ?? req.session.user?._id ?? null;
//         const { amount } = req.body;

//         if (!userId) {
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: 'User not authenticated' });
//         }

//         if (!amount || amount <= 0) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Invalid amount' });
//         }

//         if (amount < 10) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Minimum top-up amount is Rs 10' });
//         }

//         if (amount > 50000) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Maximum top-up amount is Rs 50,000' });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'User not found' });
//         }

//         const options = {
//             amount: amount * 100, // Convert to paise
//             currency: 'INR',
//             receipt: `wallet_topup_${userId}_${Date.now()}`,
//             notes: {
//                 userId: userId,
//                 type: 'wallet_topup'
//             }
//         };

//         const razorpayOrder = await razorpay.orders.create(options);

//         // Store order details in session
//         req.session.walletTopUpOrderId = razorpayOrder.id;
//         req.session.walletTopUpAmount = amount;
//         await req.session.save();

//         res.status(STATUS_CODE.SUCCESS).json({
//             orderId: razorpayOrder.id,
//             amount: amount,
//             currency: 'INR',
//             key: process.env.RAZORPAY_KEY_ID,
//             name: 'Your Store Name',
//             description: 'Wallet Top-up',
//             prefill: {
//                 name: user.name,
//                 email: user.email,
//                 contact: user.phone || ''
//             }
//         });

//     } catch (error) {
//         console.error('Error creating wallet top-up order:', error);
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create payment order' });
//     }
// };

// Verify wallet top-up payment
// const verifyWalletTopUp = async (req, res) => {
//     try {
//         const userId = req.session.user?.id ?? req.session.user?._id ?? null;
//         const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

//         if (!userId) {
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: 'User not authenticated' });
//         }

//         if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Payment verification failed: Missing parameters' });
//         }

//         if (razorpay_order_id !== req.session.walletTopUpOrderId) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Payment verification failed: Order ID mismatch' });
//         }

//         // Verify signature
//         const body = razorpay_order_id + "|" + razorpay_payment_id;
//         const expectedSignature = crypto
//             .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//             .update(body.toString())
//             .digest('hex');

//         if (expectedSignature !== razorpay_signature) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Payment verification failed: Invalid signature' });
//         }

//         const amount = req.session.walletTopUpAmount;
        
//         if (!amount) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Amount not found in session' });
//         }

//         // Update user wallet
//         const user = await User.findByIdAndUpdate(
//             userId,
//             {
//                 $inc: { wallet: amount },
//                 $push: {
//                     walletHistory: {
//                         amount: amount,
//                         type: 'top-up',
//                         transactionId: razorpay_payment_id,
//                         date: new Date()
//                     }
//                 }
//             },
//             { new: true }
//         );

//         if (!user) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'User not found' });
//         }

//         // Clear session data
//         req.session.walletTopUpOrderId = null;
//         req.session.walletTopUpAmount = null;
//         await req.session.save();

//         res.status(STATUS_CODE.SUCCESS).json({ 
//             message: 'Wallet topped up successfully',
//             newBalance: user.wallet
//         });

//     } catch (error) {
//         console.error('Error verifying wallet top-up:', error);
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Payment verification failed' });
//     }
// };

// Get filtered wallet history
// const getWalletHistory = async (req, res) => {
//     try {
//         const userId = req.session.user?.id ?? req.session.user?._id ?? null;
//         const { type, minAmount, maxAmount, startDate, endDate, page = 1, limit = 10 } = req.query;

//         if (!userId) {
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: 'User not authenticated' });
//         }

//         const user = await User.findById(userId);
        
//         if (!user) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'User not found' });
//         }

//         let filteredHistory = user.walletHistory;

//         // Apply filters
//         if (type && type !== 'all') {
//             filteredHistory = filteredHistory.filter(transaction => transaction.type === type);
//         }

//         if (minAmount) {
//             filteredHistory = filteredHistory.filter(transaction => transaction.amount >= parseFloat(minAmount));
//         }

//         if (maxAmount) {
//             filteredHistory = filteredHistory.filter(transaction => transaction.amount <= parseFloat(maxAmount));
//         }

//         if (startDate) {
//             const start = new Date(startDate);
//             filteredHistory = filteredHistory.filter(transaction => new Date(transaction.date) >= start);
//         }

//         if (endDate) {
//             const end = new Date(endDate);
//             end.setHours(23, 59, 59, 999); // Include the entire end date
//             filteredHistory = filteredHistory.filter(transaction => new Date(transaction.date) <= end);
//         }

//         // Sort by date (latest first)
//         filteredHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

//         // Pagination
//         const startIndex = (page - 1) * limit;
//         const endIndex = startIndex + parseInt(limit);
//         const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

//         const totalPages = Math.ceil(filteredHistory.length / limit);

//         res.status(STATUS_CODE.SUCCESS).json({
//             history: paginatedHistory,
//             pagination: {
//                 currentPage: parseInt(page),
//                 totalPages,
//                 totalTransactions: filteredHistory.length,
//                 hasNext: page < totalPages,
//                 hasPrev: page > 1
//             }
//         });

//     } catch (error) {
//         console.error('Error fetching wallet history:', error);
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch wallet history' });
//     }
// };

// Add money to wallet (for admin or other internal processes)
// const addToWallet = async (userId, amount, type, orderId = null, transactionId = null) => {
//     try {
//         const user = await User.findByIdAndUpdate(
//             userId,
//             {
//                 $inc: { wallet: amount },
//                 $push: {
//                     walletHistory: {
//                         amount: amount,
//                         type: type,
//                         orderId: orderId,
//                         transactionId: transactionId,
//                         date: new Date()
//                     }
//                 }
//             },
//             { new: true }
//         );

//         return user;
//     } catch (error) {
//         console.error('Error adding to wallet:', error);
//         throw error;
//     }
// };

// Deduct money from wallet (for purchases)
// const deductFromWallet = async (userId, amount, type, orderId = null) => {
//     try {
//         const user = await User.findById(userId);
        
//         if (!user) {
//             throw new Error('User not found');
//         }

//         if (user.wallet < amount) {
//             throw new Error('Insufficient wallet balance');
//         }

//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             {
//                 $inc: { wallet: -amount },
//                 $push: {
//                     walletHistory: {
//                         amount: amount,
//                         type: type,
//                         orderId: orderId,
//                         date: new Date()
//                     }
//                 }
//             },
//             { new: true }
//         );

//         return updatedUser;
//     } catch (error) {
//         console.error('Error deducting from wallet:', error);
//         throw error;
//     }
// };

// Get wallet balance
// const getWalletBalance = async (req, res) => {
//     try {
//         const userId = req.session.user?.id ?? req.session.user?._id ?? null;

//         if (!userId) {
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: 'User not authenticated' });
//         }

//         const user = await User.findById(userId, 'wallet');
        
//         if (!user) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'User not found' });
//         }

//         res.status(STATUS_CODE.SUCCESS).json({ balance: user.wallet });

//     } catch (error) {
//         console.error('Error fetching wallet balance:', error);
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch wallet balance' });
//     }
// };

export default {
    loadWallet,
    // getWalletPage,
    // getWalletData,
    // createWalletTopUpOrder,
    // verifyWalletTopUp,
    // getWalletHistory,
    // addToWallet,
    // deductFromWallet,
    // getWalletBalance
};