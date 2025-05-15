import mongoose, { Types } from "mongoose";

const { Schema } = mongoose;

const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

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

userSchema.pre('save', async function (next) {
    if (!this.referalCode) { 
        let code;
        let isUnique = false;
      
        while (!isUnique) {
            code = generateReferralCode();
            const existingUser = await mongoose.models.User.findOne({ referalCode: code });
            if (!existingUser) {
                isUnique = true;
            }
        }

        this.referalCode = code;
    }
    next();
});


const User = mongoose.model("User", userSchema);

export default User;
