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

const loadAddress = async (req, res) => {

  const userId = req.session.user?.id ?? req.session.user?._id ?? null;

  if (!userId) return res.redirect('/user/login');

  const user = await User.findOne({_id : userId})
  const name = user.name;

  try {
      const addresses = await Address.find({ userId : userId });

      res.render('user/addrress', {          
          addresses,
          user,
          name, 
      });

  } catch (error) {
      console.error('Error loading addresses:', error);
      res.render('user/addrress', { title : "address", addresses: [], user: req.session.user });
  }
};

const loadAddAddress = async (req,res)=>{

  const userId = req.session.user?.id ?? req.session.user?._id ?? null;

  const user = await User.findOne({_id : userId})

  res.render('user/addAddress ', {title : "Address", user});
}

const addAddress = async (req, res) => {
  try {
      const {fullName, phone, addressLine1, addressLine2, landmark, city, state, country, altNumber, addressType, zipCode} = req.body;

      const userId = req.session.user?.id ?? req.session.user?._id ?? null;

      if (!fullName || !phone || !addressLine1 || !city || !state || !country) {
          return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "All required fields must be filled." });
      }

      let userAddress = await Address.findOne({ userId });

      if (!userAddress) {
          userAddress = new Address({
              userId,
              details: []
          });
      }

      const newIndex = userAddress.details.length;

      userAddress.details.push({
          index: newIndex,
          addressType,
          name: fullName,
          addressLine1,
          addressLine2,
          city,
          landmark,
          state,
          pincode: zipCode,
          phone,
          altPhone: altNumber
      });

      await userAddress.save();

      return res.status(STATUS_CODE.SUCCESS).json({ message: "Address added successfully" });

  } catch (error) {
      console.error("Error adding address:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: error.message || "Address creation error" });
  }
};

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

export default {
    loadAddress,loadAddAddress,addAddress,deleteAddress,loadEditAddress,editAddress
}