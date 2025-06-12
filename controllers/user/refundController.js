import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js";
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js";
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js";
import mongoose from "mongoose";
import Refund from "../../models/refundSchema.js";

const requestRefund = async (req, res) => {
  const { reason, productId } = req.body;
  const orderId = req.query.id;
  const userId = req.session.user?.id || req.session.user?._id;

  if (!orderId || !reason || !productId || !userId) {
    return res.status(STATUS_CODE.BAD_REQUEST).json({
      message: "Missing required fields: orderId, reason, productId, or userId",
    });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ message: "Order not found" });
    }
    if (order.userId.toString() !== userId.toString()) {
      return res
        .status(STATUS_CODE.FORBIDDEN)
        .json({ message: "Not authorized for this order" });
    }

    const item = order.orderItems.find(
      (item) => item.product.toString() === productId
    );
    item.individualStatus = "Refund Requested";

    const existingRefund = await Refund.findOne({
      product: productId,
      order: orderId,
    });
    if (existingRefund) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ message: "Refund already requested" });
    }

    const refund = new Refund({
      order: orderId,
      userId,
      reason,
      product: productId,
      status: "Requested",
    });

    await refund.save();

    res
      .status(STATUS_CODE.CREATED)
      .json({ message: "Refund request submitted" });
  } catch (error) {
    console.error("Refund request error:", error);
    res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};


const cancelOrder = async (req, res) => {
  try {
    console.log("tes",req.session.user);
    
    const { orderId, productId, cancelReason } = req.body;
    const userId = req.session.user?.id || req.session.user?._id;
console.log("User ID:", userId);

    // const product = await Product.findById(productId);

    if (!orderId || !productId) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ message: "Order ID and Product ID are required" });
    }

    const order = await Order.findById(orderId);
    const user = await User.findById(order.userId);

    if (!order) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ message: "Order not found" });
    }

    const item = order.orderItems.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ message: "Product not found in this order" });
    }

    if (item.individualStatus === "Cancelled") {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ message: "Item is already cancelled" });
    }

    if (item.individualStatus === "Delivered") {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ message: "Cannot cancel a delivered item" });
    }

    item.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
    });

    item.individualStatus = "Cancelled";
    item.cancelReason = cancelReason || "No reason provided";

    if (item.individualStatus === "Cancelled") {
      const user = await User.findById(userId);
    }

    const refundAmount = item.basePrice * item.quantity;

    if (order.paymentMethod === "razorpay" && order.paymentStatus === "Paid") {
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $inc: { wallet: refundAmount },
          $push: {
            walletHistory: {
              amount: refundAmount,
              type: "refund",
              orderId: order.orderId,
            },
          },
        },
        { new: true }
      );
    } else if (order.paymentMethod === "wallet" && order.paymentStatus === "Paid") {
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $inc: { wallet: refundAmount },
          $push: {
            walletHistory: {
              amount: refundAmount,
              type: "refund",
              orderId: orderId,
            },
          },
        },
        { new: true }
      );
    }


    await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { quantity: item.quantity } }
    );

    order.updatedAt = new Date();

    await order.save();

    return res
      .status(STATUS_CODE.SUCCESS)
      .json({ message: "Order item cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order item:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};


const updateRefundStatus = async (req, res) => {
  const {  status, orderId, productId } = req.body;

  try {
    const refund = await Refund.findOne({ order: orderId, product: productId });
    if (!refund) {
      return res
        .status(STATUS_CODE.STATUS_CODE.NOT_FOUND)
        .json({ error: "Refund not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Order not found" });
    }

    const user = await User.findById(order.userId);

    if (!user) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "User not found" });
    }

    // Find the specific item in the order
    const itemToUpdate = order.orderItems.find(
      (item) => item.product.toString() === productId
    );

    if (!itemToUpdate) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Matching product item in order not found" });
    }

    if (status === "Approved") {


      const refundAmount = itemToUpdate.basePrice * itemToUpdate.quantity;


      await User.findOneAndUpdate(
        { _id: user._id },
        {
          $inc: { wallet: refundAmount },
          $push: {
            walletHistory: {
              amount: refundAmount,
              type: "refund",
              orderId: order.orderId,
            },
          },
        },
        { new: true }
      );
     

      // Increase stock
      const product = await Product.findOneAndUpdate(
        { _id: productId }, // Find condition
        { $inc: { quantity: itemToUpdate.quantity } }, // Update operation
        { new: true } // Return the updated document
      );

      // Update refund
      refund.status = status;
      await refund.save();

      itemToUpdate.individualStatus = "Returned";
      await order.save();

      const allReturned = order.orderItems.every(
        (item) => item.individualStatus == "Returned"
      );

      if (allReturned) {
        await Order.findByIdAndUpdate(order._id, { status: status });
      }
      return res
        .status(STATUS_CODE.SUCCESS)
        .json({ message: `Refund of ₹${refundAmount} processed successfully` });
    } else {
      const itemToUpdate = order.orderItems.find(
        (item) => item.product.toString() === productId
      );
      refund.status = status;
      await refund.save();
      itemToUpdate.individualStatus = "Rejected";
      await order.save();

      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ message: `Refund for order #${order.orderId} rejected` });
    }
  } catch (error) {
    console.error("Error updating refund status:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export default { requestRefund, cancelOrder, updateRefundStatus };
