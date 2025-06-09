import STATUS_CODE from "../../helpers/statusCode.js";
import User from "../../models/userSchema.js";
import Address from '../../models/addressSchema.js'
import Product from "../../models/productsShema.js"
import Category from '../../models/categorySchema.js'
import nodemailer from "nodemailer";
import env from "dotenv";
import bcrypt from "bcrypt";
import Order from "../../models/orderSchema.js"
import path, { format } from 'path';
import cloudinary from '../../helpers/cloudinary.js'
import Refund from "../../models/refundSchema.js";
import {generateInvoicePDF} from "../../helpers/invoice.js"

env.config();

const deleteAddress = async (req,res) => {
  try {
      const userId = req.query.userId;
      const index = req.query.index;

      let userAddress = await Address.findOne({ userId : userId });

      userAddress.details.splice(index, 1);

      await userAddress.save();

      return res.status(STATUS_CODE.SUCCESS).json({ message: "Address deleted successfully" });

  } catch (error) {
      console.error("Error deleting address:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
}

const loadEditAddress = async (req, res) => {
  try {
      const { id, index, from } = req.query;    
      
      const userId = req.session.user?.id ?? req.session.user?._id ?? null;
      const user = await User.findOne({_id : userId})
      if (!user) {
          return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: "Unauthorized" });
      }

      const address = await Address.findOne({userId: id});

      if (!address) {
          return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Address not found" });
      }

      const selectedAddress = address.details[index];

      if (!selectedAddress) {
          return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Address details not found" });
      }

      res.render('user/editAddress', { 
          address: selectedAddress,
          user,
          addressId: id,
          index,
          from
      });
  } catch (error) {
      console.error("Error loading address:", error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ 
          error: "Internal Server Error",
          message: error.message 
      });
  }
};

const editAddress = async (req,res) => {
  try {
      const { fullName, phone, addressLine1, addressLine2, landmark, city, state, country, altNumber, addressType, zipCode, index, from } = req.body;


      const userId = req.session.user?.id ?? req.session.user?._id ?? null;


      if (!fullName || !phone || !addressLine1 || !city || !state || !country) {
          return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "All required fields must be filled." });
      }

      let userAddress = await Address.findOne({ userId });

      userAddress.details[index] = {
          addressType,
          name: fullName,
          addressLine1,
          addressLine2,
          city,
          landmark,
          state,
          pincode: zipCode,
          phone,
          altPhone: altNumber,
      };

      await userAddress.save();

      if(from === 'checkout'){
          return res.status(STATUS_CODE.SUCCESS).json({ message: "Address updated successfully", redirectUrl: `/user/checkout?userId=${userId}` });
      }else{
          return res.status(STATUS_CODE.SUCCESS).json({ message: "Address updated successfully", redirectUrl: '/user/address' });

      }

  } catch (error) {
      console.error("Error updating address:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: error.message || "Address editing error" });
  }
}

const loadPrivacy = async (req, res) => {
  try {
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;

    if (!userId) {
      return res.status(STATUS_CODE.BAD_REQUEST).send("User ID not found in session.");
    }

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render('partials/404');
    }

    const firstName = user.name;

    if (user.password != null) {
      res.render('user/privacySettings', {
        title: "Privacy settings",
        user,
        firstName
      });
    } else {
      res.render('user/privacySettingsGoogle', {
        title: "Privacy settings",
        user,
        firstName
      });
    }
  } catch (error) {
    console.error("Error loading privacy settings:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).render('partials/404');
  }
};

const updatePassword = async (req, res) => {
  try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.session.user?.id ?? req.session.user?._id ?? null;

      if (!userId) {
          return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: "User not authenticated" });
      }

      const user = await User.findOne({ _id: userId });
      if (!user) {
          return res.status(STATUS_CODE.NOT_FOUND).json({ error: "User not found" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
          return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: "Old password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return res.status(STATUS_CODE.SUCCESS).json({ message: "Password changed successfully" });
  } catch (error) {
      console.error("Error updating password:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "An error occurred while updating the password" });
  }
};

const loadOrders = async (req,res) => {
  try {
    
      const userId = req.session.user?.id ?? req.session.user?._id ?? null;

      const user = await User.findOne({_id : userId})

      if (!userId) {
          return res.status(STATUS_CODE.UNAUTHORIZED).redirect('/user/login');
      }
      const firstName = user.name;
      const orders = await Order.find({ userId })
              .populate({
                  path: 'orderItems.product',
              })
              .sort({ createdAt: -1 });

      res.render('user/myOrders',{title : "My Orders",orders, user, firstName});

  } catch (error) {
      console.error('Error loading orders:', error.message);
  }
}

const loadOrderDetails = async (req,res)=> {
  try {
      const userId = req.session.user?.id ?? req.session.user?._id ?? null;
      const orderId = req.query.id;

      if (!userId) {
          return res.status(STATUS_CODE.UNAUTHORIZED).redirect('/user/login');
      }

      const user = await User.findOne({ _id : userId, isBlocked : false});

      if(!user){
          return res.redirect('/')
      }

      const firstName = user.name;

      const order = await Order.findOne({ _id : orderId }).populate('orderItems.product');

      const refundStatusArray = await Refund.find({ order: orderId }).populate('product');

      const refundMap = {};

      refundStatusArray.forEach(refund => {
        if (refund.product) {
            refundMap[refund.product.toString()] = refund;
        }
    });
    
        const address = order.address;

        if (!address || address.length === 0) {
            return res.status(STATUS_CODE.NOT_FOUND).render('error', { message: 'Address not found' });
        }

      res.render('user/orderDetails2',{order, address, user, firstName, refundMap});

  } catch (error) {
      console.error('Error loading orders...:', error.message);
  }
}


const downloadOrderInvoice = async (req, res) => {
  try {
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    const orderId = req.query.id;

    if (!userId) {
      return res.status(STATUS_CODE.UNAUTHORIZED).redirect('/user/login');
    }

    const user = await User.findOne({ _id: userId, isBlocked: false });
    if (!user) {
      return res.redirect('/');
    }

    const order = await Order.findOne({ _id: orderId }).populate('orderItems.product');
    if (!order) {
      return res.status(STATUS_CODE.NOT_FOUND).send('Order not found');
    }
    
    const address = order.address;
    
    const pdfBuffer = await generateInvoicePDF(order, address, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderId || order._id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice PDF:', error.message);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send('Error generating invoice. Please try again later.');
  }
};

export default { deleteAddress, loadEditAddress, editAddress,
    loadPrivacy, updatePassword, loadOrders, loadOrderDetails, downloadOrderInvoice,
}