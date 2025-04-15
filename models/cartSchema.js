import mongoose from "mongoose";
import Products from './productsShema.js'
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    name: { 
        type: String,
        required: true 
    },
    brand: {
        type: String, 
        required: true 
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    basePrice: {
        type: Number,
        required: true 
    },
    productImage: {
        type: String,
        required: true
    }
});

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [cartItemSchema]
}, { timestamps: true });


const Cart = mongoose.model("Cart", cartSchema)

export default Cart;