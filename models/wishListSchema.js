import mongoose from "mongoose";
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true
    },
}, { timestamps: true });


const Wishlist = mongoose.model("Wishlist", wishlistSchema)

export default Wishlist;