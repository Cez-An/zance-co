import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema({
    orderId: {
        type: String,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        name : {
            type : String,
            required : true
        },
        productImage : {
            type : String
        },
        basePrice: {
            type: Number
        },
        quantity: {
            type: Number,
            required: true
        },
        brand : {
            type : String,
        },
        discountPrice: {
            type: Number,
            required: false
        },
        finalPrice : {
            type: Number,
            required: false
        },
        cancelReason: {
            type: String
        },
        statusHistory: [{
            status: {
                type: String,
                required: true,
                enum: ['Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Payment Failed','Returned']
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        individualStatus : {
            type : String
        },
    }],
    address: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    paymentStatus: {
        type: String,
        required: false,
        default:'Pending',
        enum: ['Pending', 'Paid', 'Failed']
    },
    paymentId: {
        type: String
    },
    coupon: {
        type: Number
    },
    deliveryCharge: {
        type: Number
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'wallet', 'netbanking']
    },
    failureReason : {
        type: String,
    },
    totalPrice : {
        type : Number,
        required : true,
    },
    status : {
        type: String,
        enum: ['Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Requested', 'Approved', 'Rejected']
    },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;