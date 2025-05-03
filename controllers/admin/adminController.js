import { render } from "ejs";
import STATUS_CODE from "../../helpers/statusCode.js";
import Admin from "../../models/adminSchema.js";
import bcrypt from "bcrypt";
import User from "../../models/userSchema.js";
import Order from "../../models/orderSchema.js";
import Address from "../../models/addressSchema.js";
import Refund from "../../models/refundSchema.js";





const renderAdminLoginPage = (req, res) => {
  try {
    console.log(`Rendering Admin Login Page
      `);

    if (req.session.admin) {
      return res.status(302).redirect("/admin/dashboard");
    }
    res.status(200).render("admin/login", { message: null });
    
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).render("partials/admin/404.ejs", {
      statuscode: "",
      errorname: "",
      message: "Something went wrong! Please try again later.",
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    console.log(`Login POST req accessed
      `);

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.warn(`Login failed: Invalid credentials for email - ${email}`);
      return res.status(STATUS_CODE.UNAUTHORIZED).render("admin/login", {
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      console.warn(`Login failed: Incorrect password for email - ${email}`);
      return res.status(STATUS_CODE.UNAUTHORIZED).render("admin/login", {
        message: "Invalid email or password",
      });
    }

    req.session.admin = { id: admin._id, email: admin.email };

    console.info(`Admin logged in successfully: ${email}
      `);

    return res.redirect("/admin/dashboard");
    
  } catch (error) {
    console.error("Admin login error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .render("admin/error-admin");
  }
};

const renderDashboard = (req, res) => {
  try {
    console.log(`Rendering Dashboard Page
      `);
    res.status(STATUS_CODE.SUCCESS).render("admin/dashboard.ejs");
  } catch (error) {
    console.error("Error occurred while loading the dashboard:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("admin/error-admin");
  }
};

const logout = (req, res) => {
  try {
    console.log(`Logout button clicked
      `);

    req.session.destroy();
    res.status(STATUS_CODE.SUCCESS).redirect("/admin/login");

  } catch (error) {
    console.error("Unexpected error during logout:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render("admin/error-admin");
  }
};

const viewOrders = async (req, res) => {
  const orderId = req.query.id;

  const order = await Order.findOne({ _id : orderId }).populate('userId').populate('orderItems.product');
  // console.log(order);
  if(!order){
      return res.status(STATUS_CODE.NOT_FOUND).json({message : 'Order not found'})
  }

  const activeItems = order.orderItems.filter(item => item.currentStatus !== 'Cancelled');

  const allShipped = activeItems.length > 0 && activeItems.every(item => item.currentStatus === 'Shipped');
  const allOutForDelivery = activeItems.length > 0 && activeItems.every(item => item.currentStatus === 'Out for Delivery');
  
  const addressId = order.address

  const addresses = await Address.findOne(
      { 'details._id': addressId },
      { details: { $elemMatch: { _id: addressId } } }
  );

  const refunds = await Refund.find({ order: orderId });
  const refundMap = {};

  refunds.forEach(refund => {
      refundMap[refund.product] = refund;
  });


  const address = addresses?.details?.[0] || null; 

  res.render('admin/viewOrders', { title: 'Orders', order, address, allShipped, allOutForDelivery, refundMap });
}

const updateAllOrderItemsStatus = async (req, res) => {
  try {
      const orderId = req.query.id;
      const { status } = req.body;

      const order = await Order.findOne({ _id:orderId });
      if (!order) return res.status(STATUS_CODE.NOT_FOUND).json({ message: 'Order not found' });

      order.orderItems.forEach(item => {
          if (item.currentStatus === 'Cancelled') return;

          item.currentStatus = status;
          item.statusHistory.push({ status, timestamp: new Date() });
      });

      const nonCancelledStatuses = order.orderItems
          .filter(item => item.currentStatus !== 'Cancelled')
          .map(item => item.currentStatus);

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


async function updateStatus(req, res) {
  console.log("......................................................................................");
  
  const { id } = req.query;
  console.log(id);
  
  const { productId, status, cancelReason } = req.body;

  try {
      const order = await Order.findOne({ _id: id });
      if (!order) {
          return res.status(STATUS_CODE.NOT_FOUND).json({ message: 'Order not found' });
      }
      const item = order.orderItems.find(item => item.product?.toString() === productId);

      if (!item) {
          return res.status(STATUS_CODE.NOT_FOUND).json({ message: 'Product not found in order' });
      }

      // Add status update to history
      item.statusHistory.push({ status, timestamp: new Date() });

      item.currentStatus = status;

      if (status === 'Cancelled') {
          item.cancelReason = cancelReason;
      }

      const nonCancelledStatuses = order.orderItems
          .filter(item => item.currentStatus !== 'Cancelled')
          .map(item => item.currentStatus);

      const allSame = nonCancelledStatuses.every(s => s === status);

      if (allSame) {
          order.status = status;
      }

      order.updatedAt = new Date();
      await order.save();

      return res.status(STATUS_CODE.SUCCESS).json({ message: 'Status updated successfully', order });
  } catch (error) {
      console.error(error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: 'Error updating status', error });
  }
}


export default { renderAdminLoginPage, adminLogin, renderDashboard, logout,viewOrders,updateStatus,updateAllOrderItemsStatus };
