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

export default{
    loadOrders,loadOrderDetails,downloadOrderInvoice
}