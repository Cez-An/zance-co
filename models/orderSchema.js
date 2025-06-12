import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        productImage: {
          type: String,
        },
        basePrice: {
          type: Number,
        },
        quantity: {
          type: Number,
          required: true,
        },
        brand: {
          type: String,
        },
        discountPrice: {
          type: Number,
          required: false,
        },
        finalPrice: {
          type: Number,
          required: false,
        },
        cancelReason: {
          type: String,
        },
        statusHistory: [
          {
            status: {
              type: String,
              required: true,
              enum: [
                "Placed",
                "Shipped",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
                "Payment Failed",
                "Returned",
                "Pending"
              ],
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        individualStatus: {
          type: String,
        },
      },
    ],
    address: {
      addressType: { type: String, required: true },
      name: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      landmark: { type: String },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
      altPhone: { type: String },
    },
    paymentStatus: {
      type: String,
      required: false,
      default: "Pending",
      enum: ["Pending", "Paid", "Failed"],
    },
    paymentId: {
      type: String,
    },
    coupon: {
      type: Number,
    },
    deliveryCharge: {
      type: Number,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "wallet", "razorpay"],
    },
    failureReason: {
      type: String,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Placed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Requested",
        "Approved",
        "Rejected",
        "Pending"
      ],
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
