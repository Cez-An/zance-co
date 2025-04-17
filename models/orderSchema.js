import mongoose from "mongoose";

const Schema = mongoose.Schema;

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],

    shippingCost: { type: Number, required: false },
    tax: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    paymentInfo: {
      method: { type: String, required: true },
      transactionId: { type: String },
      paymentStatus: {
        type: String,
        enum: ["paid", "unpaid", "failed", "refunded"],
        default: "unpaid",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;
