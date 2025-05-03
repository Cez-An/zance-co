import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js"

const loadWallet = async(req, res) =>{
    try {
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;
        console.log(userId);
        
        if(!userId){
            return res.status(STATUS_CODE.UNAUTHORIZED).json({message : 'Please login to continue..!'})
        }

        const user = await User.findOne({ _id : userId, isBlocked : false});


        res.render('user/myWallet', { user })
    } catch (error) {
        
    }
}


export default {loadWallet,}