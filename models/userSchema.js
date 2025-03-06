import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      sparse: true,
      default: null,
      required:false
    },
    gender: {
      type: String,
      enum: ["male", "female"],
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
    isAdmin: {
      type: Boolean,
      default: false,
    },
    cart: [
      {
        type: Schema.Types.ObjectId,
        ref: "Cart",
      },
    ],
    wallet: {
      type: Number,
      default: 0,
    },
    wishList: [
      {
        type: Schema.Types.ObjectId,
        ref: "Wishlist",
      },
    ],
    orderHistory: {
      type: [Schema.Types.ObjectId],
      ref: "Order",
    },
    createdOn: {
      type: Date,
      default: Date.now,
    },
    referralCode: {
      type: String,
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
    searchHistory: [
      {
        category: {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
        brand: {
          type: String,
        },
        searchOn: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
