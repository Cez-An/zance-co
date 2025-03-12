import mongoose from "mongoose";

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      required: false,
      default:0,
    },
    discount:{
      type:Number,
      required:false,
      default:0,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    categoryOffer: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
