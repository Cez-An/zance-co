import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js";
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js";
import STATUS_CODE from "../../helpers/statusCode.js";
import mongoose from "mongoose";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_API_KEY,
  key_secret: process.env.RAZOR_API_SECRET,
});

const loadPayments = async (req, res) => {
  try {
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const user = await User.findOne({ _id: userId, isBlocked: false });

    if (!user) {
      return res.status(STATUS_CODE.FORBIDDEN).redirect("/");
    }

    const cart = await Cart.findOne({ userId: userId }).populate(
      "items.productId"
    );

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.redirect("/cart");
    }

    let cartTotal = 0;
    let deliveryCharge = 0;
    let grandTotal = 0;

    if (cart && cart.items.length > 0) {
      cartTotal = cart.items.reduce((acc, item) => {
        const product = item.productId;
        const price = product?.offerPrice || product?.offerPrice || 0;
        return acc + item.quantity * price;
      }, 0);

      deliveryCharge = cartTotal < 499 ? 40 : 0;
      grandTotal = cartTotal + deliveryCharge;
    }

    const couponDiscount = req.session.couponDiscount || 0;
    const couponId = req.session.couponId || "";

    grandTotal = cartTotal + deliveryCharge - couponDiscount;

    res.render("user/payment", {
      user,
      cart,
      cartTotal,
      deliveryCharge,
      grandTotal,
      couponDiscount,
      couponId,
      RAZOR_API_KEY: process.env.RAZOR_API_KEY,
    });
  } catch (error) {
    console.error("Error loading payment:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("error", {
      message: "Something went wrong. Please try again later.",
    });
  }
};

const generateOrderId = async () => {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  const id = `ORD#${randomNumber}`;
  const ifExists = await Order.findOne({ orderId: id });
  return ifExists ? generateOrderId() : id;
};


const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.session.user?.id ?? req.session.user?._id;
    if (!userId) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: "User not logged in" });
    }
    const addressId = req.session.selectedAddress;

    if (!addressId) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: "No address selected razor pay" });
    }
    const addressDoc = await Address.findOne({ userId: userId });
    const address = addressDoc.details.find(
      (item) => item._id.toString() === addressId
    );

    if (!address) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Address not found" });
    }
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: "Cart is empty" });
    }

    const cartTotal = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.productId.offerPrice,
      0
    );
    const deliveryCharge = cartTotal < 499 ? 40 : 0;
    const couponDiscount = req.session.couponDiscount || 0;
    const grandTotal = cartTotal + deliveryCharge - couponDiscount;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(grandTotal * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const orderID = await generateOrderId();

    const order = new Order({
      userId,
      orderId: orderID,
      razorpayOrderId: razorpayOrder.id,
      orderItems: cart.items.map((item) => ({
        product: item.productId._id,
        name: item.productId.name,
        quantity: item.quantity,
        basePrice: item.productId.offerPrice,
        brand: item.productId.brand,
        productImage: item.productId.productImage[0],
        individualStatus: "Pending",
        statusHistory: [{ status: "Pending", timestamp: new Date() }],
      })),
      totalPrice: grandTotal,
      paymentMethod: "razorpay",
      paymentStatus: "Pending",
      status: "Pending",
      address: address,
      coupon: couponDiscount,
    });

    await order.save();
    await Cart.findOneAndDelete({ userId });

    return res.status(STATUS_CODE.SUCCESS).json({
      orderId: razorpayOrder.id,
      amount: grandTotal * 100,
      currency: "INR",
      dbOrderId: order._id, // important for retry
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to create order" });
  }
};

const paymentSuccess = async (req, res) => {
  try {
    const discount = req.session.couponDiscount;
    console.log(discount);

    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const { paymentMethod } = req.body;

    if (paymentMethod === "razorpay") {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;
      const userId = req.session.user?.id ?? req.session.user?._id;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res
          .status(STATUS_CODE.BAD_REQUEST)
          .json({ error: "Missing Razorpay parameters" });
      }

      const order = await Order.findOne({
        userId,
        paymentStatus: "Pending",
      });

      if (!order) {
        return res
          .status(STATUS_CODE.NOT_FOUND)
          .json({ error: "Pending order not found" });
      }

      // Update order
      order.paymentStatus = "Paid";
      order.paymentId = razorpay_payment_id;
      order.status = "Placed";

      order.orderItems.forEach((item) => {
        item.individualStatus = "Placed";
        item.statusHistory.push({ status: "Placed", timestamp: new Date() });
      });

      await order.save();

      // Reduce stock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
        });
      }

      // Clean up
      
      req.session.couponDiscount = 0;
      req.session.couponId = "";
      await req.session.save();

      return res
        .status(STATUS_CODE.SUCCESS)
        .json({ message: "Payment successful and order placed" });
    }

    const addressId = req.session.selectedAddress;

    if (!addressId) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: "No address selected" });
    }
    const addressDoc = await Address.findOne({ userId: userId });
    const address = addressDoc.details.find(
      (item) => item._id.toString() === addressId
    );

    if (!address) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Address not found" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: "Cart is empty" });
    }

    const orderID = await generateOrderId();

    if (paymentMethod === "cod") {
      let cartTotal = cart.items.reduce(
        (acc, item) => acc + item.quantity * item.productId.offerPrice,
        0
      );
      const deliveryCharge = cartTotal < 499 ? 40 : 0;
      const couponDiscount = discount || 0;
      console.log("coupon discount", couponDiscount);

      const grandTotal = cartTotal + deliveryCharge - couponDiscount;

      if (grandTotal > 1001) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          error: "Cash on Delivery is not allowed for orders above Rs 1000",
        });
      }

      const order = new Order({
        userId,
        orderId: orderID,
        orderItems: cart.items.map((item) => ({
          product: item.productId._id,
          name: item.productId.name,
          quantity: item.quantity,
          basePrice: item.productId.offerPrice,
          brand: item.productId.brand,
          productImage: item.productId.productImage[0],
          individualStatus: "Placed",
          statusHistory: [{ status: "Placed", timestamp: new Date() }],
        })),
        totalPrice: grandTotal,
        paymentMethod,
        coupon: couponDiscount,
        paymentStatus: "Pending",
        address: address,
        status: "Placed",
      });

      for (let item of cart.items) {
        await Product.findOneAndUpdate(
          { _id: item.productId._id },
          { $inc: { quantity: -item.quantity } }
        );
      }

      await order.save();

      if (req.session.couponDiscount) {
        req.session.couponDiscount = 0;
        req.session.couponId = "";
        await req.session.save();
      }
      await Cart.findByIdAndDelete(cart._id);
      return res
        .status(STATUS_CODE.SUCCESS)
        .json({ message: "Order placed successfully" });
    } else if (paymentMethod === "wallet") {
      const user = await User.findById(userId);

      let cartTotal = cart.items.reduce(
        (acc, item) => acc + item.quantity * item.productId.offerPrice,
        0
      );
      const deliveryCharge = cartTotal < 499 ? 40 : 0;
      const couponDiscount = discount || 0;
      const grandTotal = cartTotal + deliveryCharge - couponDiscount;

      if (user.wallet < grandTotal) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          error:
            "Insufficient wallet balance. Please choose another payment method.",
        });
      }

      user.wallet -= grandTotal;

      user.walletHistory.push({
        amount: -Math.abs(grandTotal),
        type: "purchase",
        orderId: orderID,
        date: new Date(),
      });

      await user.save();

      const order = new Order({
        userId,
        orderId: orderID,
        orderItems: cart.items.map((item) => ({
          product: item.productId._id,
          name: item.productId.name,
          quantity: item.quantity,
          basePrice: item.productId.offerPrice,
          brand: item.productId.brand,
          productImage: item.productId.productImage[0],
          individualStatus: "Placed",
          statusHistory: [{ status: "Placed", timestamp: new Date() }],
        })),
        totalPrice: grandTotal,
        paymentMethod: "wallet",
        paymentStatus: "Paid",
        address: address,
        coupon: couponDiscount,
        status: "Placed",
      });

      for (let item of cart.items) {
        await Product.findOneAndUpdate(
          { _id: item.productId._id },
          { $inc: { quantity: -item.quantity } }
        );
      }

      await order.save();

      if (req.session.couponDiscount) {
        req.session.couponDiscount = 0;
        req.session.couponId = "";
        await req.session.save();
      }

      await Cart.findByIdAndDelete(cart._id);
      return res
        .status(STATUS_CODE.SUCCESS)
        .json({ message: "Order placed using wallet successfully" });
    } else {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: "Payment method not implemented" });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Payment processing failed" });
  }
};

const paymentFailed = async (req, res) => {
  try {
    const { error } = req.body;
    console.error("Payment failed:", error);

    return res
      .status(STATUS_CODE.BAD_REQUEST)
      .json({ error: "Payment failed", details: error });
  } catch (err) {
    console.error("Error handling payment failure:", err);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;

    if (!userId) {
      console.error("User ID is missing in session.");
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .render("error", { message: "Invalid session. Please log in again." });
    }

    const user = await User.findOne({ _id: userId });

    const order = await Order.findOne({ userId })
      .populate({
        path: "orderItems.product",
      })
      .sort({ createdAt: -1 });

    if (!order) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .render("error", { message: "Order not found" });
    }

    const orderItems = order.orderItems;

    const address = order.address;

    if (!address || address.length === 0) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .render("error", { message: "Address not found" });
    }

    const shippingAddress = address;

    return res.render("user/orderConfirmation", {
      title: "Checkout",
      user,
      shippingAddress,
      order,
      orderItems,
    });
  } catch (error) {
    console.error(`Error confirming order: ${error.message}`);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("error", {
      message: "Something went wrong. Please try again later.",
    });
  }
};

const retryRazorpayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.user?.id ?? req.session.user?._id;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order || order.paymentStatus === "Paid") {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: "Retry not possible for this order" });
    }

    const newRazorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100),
      currency: "INR",
      receipt: `retry_${Date.now()}`,
    });

    order.razorpayOrderId = newRazorpayOrder.id;
    await order.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      orderId: newRazorpayOrder.id,
      amount: newRazorpayOrder.amount,
      currency: newRazorpayOrder.currency,
      dbOrderId: order._id,
    });
  } catch (err) {
    console.error("Error retrying Razorpay payment:", err);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Could not retry payment" });
  }
};

export default {
  loadPayments,
  paymentSuccess,
  createRazorpayOrder,
  paymentFailed,
  confirmOrder,
  retryRazorpayPayment,
};
