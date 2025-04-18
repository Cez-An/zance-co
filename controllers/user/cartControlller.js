import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js"
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js"

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
        console.log(product.category);
        
        // const category = await Category.findOne({category:product.category})

        // if(category.isListed === false){
        //     return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'Product not found.' });

        // }

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
            basePrice, 
            productImage: product.productImage[0]
        };

        const cart = await Cart.findOneAndUpdate(
            { userId, 'items.productId': product._id},
            {
                $inc: { 'items.$.quantity': quantity },
                $set: { 'items.$.basePrice': basePrice }  
            },
            { new: true }
        );

        if (!cart) {
            await Cart.findOneAndUpdate(
                { userId },
                { $push: { items: item } },
                { upsert: true, new: true }
            );
        }

        await Promise.all([
            Wishlist.findOneAndDelete({ product: productId }),
            User.findByIdAndUpdate(userId, { $set: { cart: cart?._id } })
        ]);

        return res.status(STATUS_CODE.SUCCESS).json({ message: 'Item added to cart successfully!' });

    } catch (error) {
        console.error('Add to cart error:', error.message);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error.' });
    }
};

// const updateQuantity = async (req, res) => {
//     const { productId, change } = req.body;
//     const userId = req.session.user?.id ?? req.session.user?._id ?? null;

//     try {
//         const cart = await Cart.findOne({ userId: userId });

//         if (!cart) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Cart not found" });
//         }

//         const item = cart.items.find(item =>
//             item.productId.toString() === productId
            
//         );

//         if (!item) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Product not found in cart" });
//         }

//         const product = await Product.findOne({
//             _id: productId           
//         });

//         if (!product) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Product not found" });
//         }

//         if (change > 0) {
//             if (item.quantity < variant.stock) {
//                 item.quantity += 1;
//             } else {
//                 return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "Product stock limit reached" });
//             }
//         } else if (change < 0 && item.quantity > 1) {
//             item.quantity -= 1;
//         } else if (change < 0 && item.quantity === 1) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ message: "Quantity unchanged as it’s already at minimum", cart });
//         }

//         await cart.save();

//         return res.status(STATUS_CODE.SUCCESS).json({ message: "Quantity updated successfully", cart });
//     } catch (error) {
//         console.error("Error updating quantity:", error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
//     }
// };

const updateQuantity = async (req, res) => {
    console.log(`update quantity accessed`);
    
    const { productId, change } = req.body;
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    console.log(userId);
    
    // Validate inputs
    if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
    }
    if (!productId || ![-1, 1].includes(change)) {
        return res.status(400).json({ error: "Invalid product ID or quantity change" });
    }

    try {
        // Find the cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        // Find the item in the cart
        const item = cart.items.find((item) =>
            item.productId.toString() === productId
        );
        if (!item) {
            return res.status(404).json({ error: "Product not found in cart" });
        }

        // Find the product to check stock
        const product = await Product.findOne({ _id: productId });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Update quantity based on change
        if (change > 0) {
            if (item.quantity >= product.stock) {
                return res.status(400).json({ error: "Product stock limit reached" });
            }
            item.quantity += 1;
        } else if (change < 0) {
            if (item.quantity <= 1) {
                return res.status(400).json({ error: "Cannot reduce quantity below 1" });
            }
            item.quantity -= 1;
        }
        console.log(item.quantity);
        
        if (item.quantity > 10) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                error: `Only 10 units can be purchased in one order.`
            });
        }
        // Save the updated cart
        await cart.save();

        return res.status(200).json({ message: "Quantity updated successfully", cart });
    } catch (error) {
        console.error("Error updating quantity:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const deleteFromcart = async (req,res)=> {
    try {
        const { productId } = req.body;
        const userId = req.session.user?.id ?? req.session.user?._id ?? null;
    
        const cart = await Cart.findOneAndUpdate(
            { userId: userId },
            { $pull: { items: { productId: productId } } },
            { new: true }
        );

        if (!cart) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Cart not found" });
        }
        
        res.status(STATUS_CODE.SUCCESS).json({mesage : "Item deleted from cart successfully"});
        
    } catch (error) {
        console.log(error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({message : 'Internal server error'});
    }
}


export default {
    loadCart,
    addItemToCart,
    updateQuantity,
    deleteFromcart,

}