import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js"

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;
        const user = await User.findOne({ _id: userId });
        console.log(`user data in home page is `, user);

        if(!userId){
            res.status(STATUS_CODE.UNAUTHORIZED).json({error : "Please login to view wishlist"})
        }
        const wishlist = await Wishlist.find({ userId }).populate('product');
        console.log(wishlist);
        
        res.render('user/wishlist', {            
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
        const { userId, productId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Please login to continue' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ error: 'Product not found' });
        }

        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { userId },
            { $addToSet: { product: productId } }, 
            { new: true, upsert: true } 
        );

        res.json({ message: 'Added to wishlist successfully' });

    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Please login to continue' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ error: 'Product not found' });
        }

        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist && wishlist.product.includes(productId)) {
            // 🔻 If already exists, remove it
            await Wishlist.findOneAndUpdate(
                { userId },
                { $pull: { product: productId } },
                { new: true }
            );
            return res.json({ message: 'Removed from wishlist' });
        } else {
            // 🔺 Else, add it
            await Wishlist.findOneAndUpdate(
                { userId },
                { $addToSet: { product: productId } },
                { new: true, upsert: true }
            );
            return res.json({ message: 'Added to wishlist' });
        }

    } catch (error) {
        console.error('Toggle wishlist error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const { wishlistId } = req.body;
        console.log(wishlistId);
        
        if (!wishlistId) {
            return res.status(400).json({ error: 'Wishlist ID is required' });
        }

        
        const wishlistEntry = await Wishlist.findOneAndUpdate(
            { 'product': wishlistId },
            { $pull: { product: wishlistId } },
            { new: true }
        );

        if (!wishlistEntry) {
            return res.status(404).json({ error: 'Wishlist entry not found' });
        }

        return res.json({ message: 'Removed from wishlist' });

    } catch (error) {
        console.error('Remove from wishlist error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

const wishlistToCart = async (req, res) => {
    try {
        const { userId, productId, quantity, basePrice } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Please log in to continue.' });
        }

        if (!productId || !quantity || basePrice <= 0) {
            return res.status(400).json({ error: 'Invalid input values.' });
        }

        const product = await Product.findOne({ _id: productId, isBlocked: false });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                error: `Only ${product.stock} units of "${product.name}" available in stock.`
            });
        }

        const cart = await Cart.findOne({ userId });
        let existingQuantity = 0;

        if (cart) {
            const existingItem = cart.items.find(item => item.productId.toString() === productId);
            if (existingItem) {
                existingQuantity = existingItem.quantity;
            }
        }

        if (existingQuantity + quantity > 10) {
            return res.status(400).json({
                error: 'Cannot add more than 10 units of this product to the cart.'
            });
        }

        const item = {
            name: product.name,
            brand: product.brand,
            productId: product._id,
            quantity: parseInt(quantity),
            basePrice,
            productImage: product.productImage[0]
        };

        const updatedCart = await Cart.findOneAndUpdate(
            { userId, 'items.productId': product._id },
            {
                $inc: { 'items.$.quantity': quantity },
                $set: { 'items.$.basePrice': basePrice }
            },
            { new: true }
        );

        if (!updatedCart) {
            await Cart.findOneAndUpdate(
                { userId },
                { $push: { items: item } },
                { upsert: true, new: true }
            );
        }

        // ✅ Remove from wishlist
        await Wishlist.findOneAndUpdate(
            { userId },
            { $pull: { product: productId } }
        );

        await User.findByIdAndUpdate(userId, { $set: { cart: cart?._id } });

        return res.status(200).json({ message: 'Item moved from wishlist to cart.' });

    } catch (error) {
        console.error('Wishlist to Cart Error:', error.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};



export default { getWishlist, addToWishlist,toggleWishlist ,removeFromWishlist, wishlistToCart}