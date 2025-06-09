import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Coupon from "../../models/couponSchema.js";

const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;

        if (!userId) {
            return res.status(STATUS_CODE.UNAUTHORIZED).send('User not authenticated');
        }

        const user = await User.findOne({ _id: userId });
        const address = await Address.find({ userId });
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        let cartTotal = 0;
        let deliveryCharge = 0;
        let grandTotal = 0;


        if (cart && cart.items.length > 0) {
            cartTotal = cart.items.reduce((acc, item) => {
                const product = item.productId;
                const price = product?.salePrice || 0; 
                return acc + item.quantity * price;
            }, 0);
        
            deliveryCharge = cartTotal < 499 ? 40 : 0;
            grandTotal = cartTotal + deliveryCharge;
        }

                
        const currentDate = new Date();

        const coupons = await Coupon.find({
            status: 'Active',
            startDate: { $lte: currentDate },
            expiryDate: { $gte: currentDate },
            minPrice: { $lte: grandTotal }
        });

        res.render('user/checkout', {
            user,
            address,
            cart,
            calculatedValues: { cartTotal, deliveryCharge, grandTotal },
            coupons
        });

    } catch (error) {
        console.error('Error loading checkout:', error);
        res.status(500).send('Something went wrong while loading the checkout page.');
    }
};

const addShoppingAddress = async (req,res) =>{
    try {
        const {fullName, phone, addressLine1, addressLine2, landmark, city, state, country, altNumber, addressType, zipCode} = req.body;

        const userId = req.session.user?.id ?? req.session.user?._id ?? null;

        if(!userId){
            return res.status(STATUS_CODE.BAD_REQUEST).json("Please Login to continue")
        }

        if (!fullName || !phone || !addressLine1 || !city || !state || !country) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "All required fields must be filled." });
        }

        let userAddress = await Address.findOne({ userId });

        if (!userAddress) {
            userAddress = new Address({ userId, details: []});
        }

        const newIndex = userAddress.details.length;

        userAddress.details.push({
            index: newIndex,userId,addressType,name: fullName,
            addressLine1,addressLine2,
            city, landmark, state,
            pincode: zipCode,
            phone, altPhone: altNumber
        });

        await userAddress.save();

        return res.status(STATUS_CODE.CREATED).json({ message: "Address added successfully" , redirectUrl: `/user/checkout?userId=${userId}` });

    } catch (error) {
        console.error("Error adding address:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: error.message || "Address creation error" });
    }
}

const editshoppingAddress = async (req,res) =>{

    try {
        const { fullName, phone, addressLine1, addressLine2, landmark, city, state, country, altNumber, addressType, zipCode, index } = req.body;

        const userId = req.session.user?.id ?? req.session.user?._id ?? null;

        let userAddress = await Address.findOne({ userId });

        userAddress.details[index] = {
            addressType, name: fullName,
            addressLine1, addressLine2,
            city, landmark,
            state, country,
            pincode: zipCode,
            phone, altPhone: altNumber,
        };

        await userAddress.save();
        return res.status(STATUS_CODE.SUCCESS).json({ message: "Address updated" , redirectUrl: `/user/checkout?userId=${userId}`});


    } catch (error) {
        console.error("Error updating address:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: error.message || "Address editing error" });
    }
}

const checkoutDetails = async (req,res) => {

    const {selectedAddress, couponDiscount, couponId} = req.body;
    req.session.deliveryAddress = selectedAddress;
    req.session.couponDiscount = couponDiscount;
    req.session.couponId = couponId;
    res.redirect('/payments')
    
}

const  saveSelectedAddress = (req, res)=> {
    
    const { selectedAddress } = req.body;   
    if (!selectedAddress) {
        return res.status(STATUS_CODE.BAD_REQUEST).send('No address provided');
    }
    req.session.selectedAddress = selectedAddress;
    console.log("selectedAddress is:   ",selectedAddress)
    res.sendStatus(200);
}

export default {
    loadCheckout,
    addShoppingAddress,
    editshoppingAddress,
    checkoutDetails,
    saveSelectedAddress,
}