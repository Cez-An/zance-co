import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js";
import mongoose from "mongoose";

const loadPayments = async (req, res) => {
    try {
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;
        const user = await User.findOne({_id: userId});
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.redirect('/cart');
        }

        let cartTotal = 0;
        let deliveryCharge = 0;
        let grandTotal = 0;

        if (cart && cart.items.length > 0) {
            cartTotal = cart.items.reduce((acc, item) => acc + item.quantity * item.basePrice, 0);
            deliveryCharge = cartTotal < 499 ? 40 : 0;
            grandTotal = cartTotal + deliveryCharge;
        }

        deliveryCharge = cartTotal < 499 ? 40 : 0;

        const couponDiscount = req.session.couponDiscount || 0;

        if (req.session.couponDiscount) {
            req.session.couponDiscount = 0;
            await req.session.save();
        }

        grandTotal = cartTotal + deliveryCharge - couponDiscount;

        res.render('user/payment', {title: "Checkout", user, cart, cartTotal, deliveryCharge, grandTotal, couponDiscount});
    } catch (error) {
        console.error('Error loading payment:', error);
        
    }
}

const paymentSuccess = async (req,res) => {
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;

    const { paymentMethod } = req.body;

    const addressId = req.session.selectedAddress;
    const objectId = new mongoose.Types.ObjectId(addressId);

    const cart = await Cart.findOne({ userId : userId }).populate('items.productId');

    const generateOrderId = async () => {
        const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
        const id = `ORD#${randomNumber}`;
        const ifExists = await Order.findOne({ orderId: id });
        return ifExists ? generateProductId() : id;
      };
    const orderID = await generateOrderId();
    if(paymentMethod == 'cod'){
        const address = await Address.findOne(
            { 'details._id': objectId },
            { 'details.$': 1 }
        );

        if (address) {
            
            const order = new Order({
                userId,
                orderId:orderID,
                orderItems: cart.items.map(item => ({
                    product: item.productId._id,
                    name : item.name,
                    quantity: item.quantity,
                    basePrice: item.productId.salePrice,
                    brand : item.brand,
                    productImage : item.productImage
                })),
                totalPrice: cart.items.reduce((sum, item) => sum + item.quantity * item.basePrice, 0),
                paymentMethod,
                address : addressId,
                status: 'Placed',                
                });

            await order.save();

            await Cart.findByIdAndDelete(cart._id);

            return res.status(200).json({ message: 'Order placed successfully' });
        } else {
            return res.status(404).json({ error: 'Address not found' });
        }
    }else{
        return res.status(400).json({error : "Payment method not implemented"});
    }
}

const confirmOrder = async (req, res) => {
    try {
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    
        if (!userId) {
            console.error('User ID is missing in session.');
            return res.status(400).render('error', { message: 'Invalid session. Please log in again.' });
        }
        
        const user = await User.findOne({_id : userId});

        const order = await Order.findOne({ userId }).populate({
            path: 'orderItems.product',
    
        }).sort({ createdAt: -1 });

        const addressId = order.address
        const orderItems = order.orderItems
        

        const address = await Address.findOne(
            { 'details._id': addressId },
            { 'details.$': 1 }
        );

        const shippingAddress = address.details[0];

        return res.render('user/orderConfirmation', {title : "Checkout", user, shippingAddress, order, orderItems});
    } catch (error) {
        console.error(`Error confirming order: ${error.message}`);
        return res.status(500).render('error', { message: 'Something went wrong. Please try again later.' });
    }
}

export default { loadPayments,paymentSuccess,confirmOrder }