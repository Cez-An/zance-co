import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js";
import mongoose from "mongoose";
import Refund from "../../models/refundSchema.js";

const requestRefund = async (req, res) => {
    const { reason, productId } = req.body;
    const orderId = req.query.id;
    const userId = req.session.user?.id || req.session.user?._id;

    // Input validation
    if (!orderId || !reason || !productId || !userId) {
        return res.status(400).json({ 
            message: 'Missing required fields: orderId, reason, productId, or userId' 
        });
    }

    try {
        // Check order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized for this order' });
        }

        const item = order.orderItems.find(item => item.product.toString() === productId);
        item.individualStatus = "Refund Requested"

        // Check for existing refund
        const existingRefund = await Refund.findOne({ product: productId ,order: orderId});
        if (existingRefund) {
            return res.status(400).json({ message: 'Refund already requested' });
        }

        // Create new refund
        const refund = new Refund({
            order: orderId,
            userId,
            reason,
            product: productId,
            status: 'Requested'
        });

        await refund.save();

        res.status(201).json({ message: 'Refund request submitted' });
    } catch (error) {
        console.error('Refund request error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId, cancelReason } = req.body;

        // const product = await Product.findById(productId);

        if (!orderId || !productId) {
            return res.status(400).json({ message: 'Order ID and Product ID are required' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const item = order.orderItems.find(item => item.product.toString() === productId);

        if (!item) {
            return res.status(404).json({ message: 'Product not found in this order' });
        }

        if (item.individualStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Item is already cancelled' });
        }

        if (item.individualStatus === 'Delivered') {
            return res.status(400).json({ message: 'Cannot cancel a delivered item' });
        }

        // Update status history and current status
        item.statusHistory.push({
            status: 'Cancelled',
            timestamp: new Date()
        });

        item.individualStatus = 'Cancelled';
        item.cancelReason = cancelReason || 'No reason provided';

        await Product.findOneAndUpdate({_id:productId},{
            $inc:{quantity:item.quantity}
        });

        order.updatedAt = new Date();


        await order.save();

        return res.status(200).json({ message: 'Order item cancelled successfully' });

    } catch (error) {
        console.error('Error cancelling order item:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateRefundStatus = async (req, res) => {
    const { status, orderId, productId } = req.body;
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;

    try {
        const refund = await Refund.findOne({ order: orderId, product: productId });
        if (!refund) {
            return res.status(STATUS_CODE.STATUS_CODE.NOT_FOUND).json({ error: "Refund not found" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Order not found" });
        }

        const user = await User.findById(order.userId);

        if (!user) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ error: "User not found" });
        }

        // Find the specific item in the order
        const itemToUpdate = order.orderItems.find(item =>
            item.product.toString() === productId 
            
        );

        if (!itemToUpdate) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Matching product item in order not found" });
        }

        if (status === 'Approved') {
            // Credit wallet
            const refundAmount = itemToUpdate.basePrice * itemToUpdate.quantity;
            user.wallet += refundAmount;
            await user.save();

            // Increase stock
            const product = await Product.findOneAndUpdate(
                { _id: productId }, // Find condition
                { $inc: { quantity: itemToUpdate.quantity } }, // Update operation
                { new: true } // Return the updated document
              );

        
            // Update refund
            refund.status = status;
            await refund.save();

            itemToUpdate.individualStatus='Returned';
            await order.save();

            const allReturned = order.orderItems.every(item=>item.individualStatus=='Returned');

            if(allReturned){
                await Order.findByIdAndUpdate(order._id, { status: status });
            }

            return res.status(STATUS_CODE.SUCCESS).json({ message: `Refund of ₹${refundAmount} processed successfully` });
        } else {
            const itemToUpdate = order.orderItems.find(item =>
            item.product.toString() === productId             
        );
            refund.status = status;
            await refund.save();
            itemToUpdate.individualStatus='Rejected';
            await order.save();
            

            return res.status(STATUS_CODE.BAD_REQUEST).json({ message: `Refund for order #${order.orderId} rejected` });
        }
    } catch (error) {
        console.error("Error updating refund status:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
};


export default { requestRefund, cancelOrder,updateRefundStatus }