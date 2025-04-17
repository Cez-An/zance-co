import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;

        const user = await User.findOne({_id : userId})

        if(!userId){
            res.status(STATUS_CODE.UNAUTHORIZED).json({error : "Please login to view wishlist"})
        }

        const wishlist = await Wishlist.find({ userId }).populate('product');
        
        res.render('user/wishlist', { 
            title : "Wishlist",
            wishlist,
            user,
            userId
        });
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({error : "internal error"})
    }
};

const addToWishlist = async (req, res) => {
    try {
        const { userId, productId, color, weight } = req.body;

        if(!userId){
            return res.status(STATUS_CODE.UNAUTHORIZED).json({error : 'Please login to continue..!'})
        }
        
        const existingItem = await Wishlist.findOne({ userId, product : productId, color,  weight });

        if (existingItem) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Item already in wishlist' });
        }

        const wishlistItem = new Wishlist({
            userId,
            product : productId,
            color,
            weight
        });        
        await wishlistItem.save();

        res.json({ message: 'Added to wishlist successfully' });
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Server error' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const { wishlistId } = req.body;
        await Wishlist.findByIdAndDelete(wishlistId);
        res.json({ message: 'Item removed from wishlist' });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Error removing item' });
    }
};

export default { getWishlist, removeFromWishlist, addToWishlist }