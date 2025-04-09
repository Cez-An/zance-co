import mongoose, { Types } from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      default: null,
      required: false,
    },
    gender: {
      type: String,
      required: false,
    },
    profilePic: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
    },
    password: {
      type: String,
      required: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: {
      type:Types.ObjectId,
      ref: "Cart",
      required:false,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    referalCode: {
      type: String,
      unique: true,
      required: false,
    },
    redeemed: {
      type: Boolean,
      default: false,
    },
    redeemedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    orderHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
