import Product from "../../models/productsShema.js";
import User from "../../models/userSchema.js";
import Category from "../../models/categorySchema.js";
import STATUS_CODE from "../../helpers/statusCode.js";
import Order from "../../models/orderSchema.js";
import Address from "../../models/addressSchema.js";
import Refund from "../../models/refundSchema.js";



const loadOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 7;
        const skip = (page - 1) * limit;

        const { status, search } = req.query;

        let query = {
            paymentStatus: { $ne: 'Failed' }
        };

       
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { customer : { $regex: search, $options: 'i' } },
            ];
        }

        if (status) {
            query.status = status;

        }

        const totalProducts = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        const orders = await Order.find(query)
            .populate('userId')
            .populate('orderItems.product')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.render('admin/orders', {
            orders,
            status: req.query.clear ? '' : status,
            search: req.query.clear ? '' : search,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send('Server Error');
    }
};

const viewOrders = async (req, res) => {
    const orderId = req.query.id;
  
    const order = await Order.findOne({ _id : orderId }).populate('userId').populate('orderItems.product');

    if(!order){
        return res.status(STATUS_CODE.NOT_FOUND).json({message : 'Order not found'})
    }
  
    const activeItems = order.orderItems.filter(item => item.individualStatus !== 'Cancelled');
  
    const allShipped = activeItems.length > 0 && activeItems.every(item => item.individualStatus === 'Shipped');
    const allOutForDelivery = activeItems.length > 0 && activeItems.every(item => item.individualStatus === 'Out for Delivery');
  
    const refunds = await Refund.find({ order: orderId });
    const refundMap = {};
  
    refunds.forEach(refund => {
        refundMap[refund.product] = refund;
    });
  
    const address = order.address;
  
    res.render('admin/viewOrders', { title: 'Orders', order, address, allShipped, allOutForDelivery, refundMap });
  }
  
const updateAllOrderItemsStatus = async (req, res) => {
    try {
        const orderId = req.query.id;
        const { status } = req.body;
  
        const order = await Order.findOne({ _id:orderId });
        if (!order) return res.status(STATUS_CODE.NOT_FOUND).json({ message: 'Order not found' });
  
        order.orderItems.forEach(item => {
            if (item.individualStatus === 'Cancelled') return;
  
            item.individualStatus = status;
            item.statusHistory.push({ status, timestamp: new Date() });
        });
  
        const nonCancelledStatuses = order.orderItems
            .filter(item => item.individualStatus !== 'Cancelled')
            .map(item => item.individualStatus);
  
        const allSame = nonCancelledStatuses.every(s => s === status);
  
        if (allSame) {
            order.status = status;
        }
  
        await order.save();
  
        res.json({ message: `Order items marked as ${status}` });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
  };

// async function updateStatus(req, res) {
    
//     const { id } = req.query;   
//     const { productId, status, cancelReason } = req.body;  
//     try {
//         const order = await Order.findOne({ _id: id });
//         if (!order) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ message: 'Order not found' });
//         }
//         const item = order.orderItems.find(item => item.product?.toString() === productId);
  
//         if (!item) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ message: 'Product not found in order' });
//         }
  
//         item.statusHistory.push({ status, timestamp: new Date() });
  
//         item.individualStatus = status;
  
//         if (status === 'Cancelled') {
//             item.cancelReason = cancelReason;
//         }
  
//         const nonCancelledStatuses = order.orderItems
//             .filter(item => item.individualStatus !== 'Cancelled')
//             .map(item => item.individualStatus);
  
//         const allSame = nonCancelledStatuses.every(s => s === status);
  
//         if (allSame) {
//             order.status = status;
//         }
  
//         order.updatedAt = new Date();
//         await order.save();  
//         return res.status(STATUS_CODE.SUCCESS).json({ message: 'Status updated successfully', order });

//     } catch (error){
//         console.error(error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: 'Error updating status', error });
//     }
//   }

// async function updateStatus(req, res) {
//   const { id } = req.query;
//   const { productId, status, cancelReason } = req.body;

//   try {
//     const order = await Order.findOne({ _id: id });
//     if (!order) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Order not found" });
//     }

//     const item = order.orderItems.find(item => item.product?.toString() === productId);
//     if (!item) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Product not found in order" });
//     }

//     item.statusHistory.push({ status, timestamp: new Date() });
//     item.individualStatus = status;

//     if (status === "Cancelled") {
//       item.cancelReason = cancelReason;

//       const product = await Product.findById(productId);
//       if (product) {
//         product.quantity += item.quantity;
//         await product.save();
//       }
//     }

//     // Update order status if all non-cancelled items match this status
//     const nonCancelledStatuses = order.orderItems
//       .filter(item => item.individualStatus !== "Cancelled")
//       .map(item => item.individualStatus);

//     const allSame = nonCancelledStatuses.every(s => s === status);
//     if (allSame && nonCancelledStatuses.length > 0) {
//       order.status = status;
//     }

//     order.updatedAt = new Date();
//     await order.save();

//     return res.status(STATUS_CODE.SUCCESS).json({ message: "Status updated successfully", order });
//   } catch (error) {
//     console.error(error);
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Error updating status", error });
//   }
// }


async function updateStatus(req, res) {
  const { id } = req.query;
  const { productId, status, cancelReason } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Order not found" });
    }

    const item = order.orderItems.find(item => item.product?.toString() === productId);
    if (!item) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Product not found in order" });
    }

    item.statusHistory.push({ status, timestamp: new Date() });
    item.individualStatus = status;

    if (status === "Cancelled") {
      item.cancelReason = cancelReason;

      const product = await Product.findById(productId);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }

      if (order.paymentMethod === "razorpay" && order.paymentStatus === "Paid") {
        const user = await User.findById(order.userId);
        if (user) {
          const refundAmount = item.basePrice * item.quantity; 
          user.wallet += refundAmount;
          await user.save();
        }
      }
    }

    const nonCancelledStatuses = order.orderItems
      .filter(i => i.individualStatus !== "Cancelled")
      .map(i => i.individualStatus);

    const allSame = nonCancelledStatuses.every(s => s === status);
    if (allSame && nonCancelledStatuses.length > 0) {
      order.status = status;
    }

    order.updatedAt = new Date();
    await order.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      message: "Status updated successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      message: "Error updating status",
      error,
    });
  }
}


export default {  updateStatus, updateAllOrderItemsStatus, loadOrders, viewOrders, }