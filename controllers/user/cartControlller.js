import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";


const loadCart = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/user/login');
        }

        const userId = req.session.user?.id ?? req.session.user?._id ?? null;

        const user = await User.findOne({ _id : userId});

        const cart = await Cart.findOne({ userId : userId }).populate('items.productId');

        if(!cart){
            return res.render('user/cart', {cart : null, user });
        }
        return res.render('user/cart', {cart, user });

    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }

}

const addItemToCart = async (req, res) => {
    try {
        const { userId, productId, quantity, basePrice } = req.body;
        console.log(`user id is:`,userId,`product id is:`,productId,`quantity is:`, quantity,`baseprice is:`, basePrice);
        
        if (!userId) {
            return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: 'Please log in to add items to your cart.' });
        }

        if (!productId || !quantity || basePrice <= 0) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'Invalid input values.' });
        }

        const product = await Product.findOne({ productId: productId, isBlocked: false });
        if (!product) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'Product not found.' });
        }

        let availableStock = product.stock;

        if (quantity > availableStock) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                error: `Only ${availableStock} units of "${product.name}" available in stock for this variant.`
            });
        }

        const item = {
            name: product.name,
            brand: product.brand,
            productId: product._id,
            quantity: parseInt(quantity),            
            basePrice,  // Using basePrice from request body
            productImage: product.productImage[0]
        };

        // First attempt to update existing item in cart
        const cart = await Cart.findOneAndUpdate(
            { userId, 'items.productId': product._id},
            {
                $inc: { 'items.$.quantity': quantity },
                $set: { 'items.$.basePrice': basePrice }  // Changed price to basePrice
            },
            { new: true }
        );

        // If item doesn't exist in cart, add new item
        if (!cart) {
            await Cart.findOneAndUpdate(
                { userId },
                { $push: { items: item } },
                { upsert: true, new: true }
            );
        }

        await Promise.all([
            // Wishlist.findOneAndDelete({ product: productId }),
            User.findByIdAndUpdate(userId, { $set: { cart: cart?._id } })
        ]);

        return res.status(STATUS_CODE.SUCCESS).json({ message: 'Item added to cart successfully!' });

    } catch (error) {
        console.error('Add to cart error:', error.message);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error.' });
    }
};







export default {
    loadCart,
    addItemToCart,

}