import mongoose, { Types } from "mongoose";

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      unique:true,
      required: true,
    },
    productId:{
      type:String,
      required:true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type:Types.ObjectId,
      ref:'Category',
      required: false,
    },
    offerPrice: {
      type: Number,
      required: false,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    productOffer: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      required: false,
    },
    productImage: {
      type: [String],
      required: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Available", "Out Of Stock", "Discontinued"],
      // required: true,
      default: "Available",
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
