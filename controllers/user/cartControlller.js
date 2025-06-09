import User from "../../models/userSchema.js";
import Product from "../../models/productsShema.js";
import Cart from "../../models/cartSchema.js";
import Address from "../../models/addressSchema.js";
import Order from "../../models/orderSchema.js";
import STATUS_CODE from "../../helpers/statusCode.js";
import Category from "../../models/categorySchema.js";
import Wishlist from "../../models/wishListSchema.js";
import mongoose from "mongoose";

const loadCart = async (req, res) => {
  try {
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;

    const user = await User.findOne({ _id: userId });

    // const cart = await Cart.findOne({ userId : userId }).populate('items.productId');

    const cart = await Cart.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $unwind: "$productData",
      },
      {
        $match: {
          "productData.isBlocked": false,
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          items: {
            $push: {
              _id: "$items._id",
              quantity: "$items.quantity",
              basePrice: "$items.basePrice",
              productImage: "$items.productImage",
              productId: "$productData", // embed full product data
            },
          },
        },
      },
    ]);

    //     console.log("Cart Items:");
    // cart[0].items.forEach((item, index) => {
    //   console.log(`Item ${index + 1}:`, item);
    // });

    // console.dir(cart[0], { depth: null });

   

    if (!cart) {
      return res.render("user/cart", { cart: null, user });
    }
    return res.render("user/cart", { cart: cart[0], user });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};

const addItemToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, basePrice } = req.body;
    console.log(
      `user id is:`,
      userId,
      `product id is:`,
      productId,
      `quantity is:`,
      quantity,
      `baseprice is:`,
      basePrice
    );
    const parsedQuantity = parseInt(quantity);


    if (!userId) {
      return res
        .status(STATUS_CODE.UNAUTHORIZED)
        .json({ error: "Please log in to add items to your cart." });
    }

    if (!productId || !quantity || basePrice <= 0) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Invalid input values." });
    }

    const product = await Product.findOne({ _id: productId, isBlocked: false });

    if (!product) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Product not found." });
    }

    const category = await Category.findById({ _id: product.category });

    if (category.isListed === false) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Product not found." });
    }

    const cartqnt = await Cart.findOne({ userId });

    let existingCartQuantity = 0;

    if (cartqnt) {
      const existingItem = cartqnt.items.find(
        (item) => item.productId.toString() === product._id.toString()
      );

      if (existingItem){
        existingCartQuantity = existingItem.quantity;
      }
    }

    const totalRequestedQuantity = parsedQuantity + existingCartQuantity;


    if (totalRequestedQuantity > product.quantity){
      return res.status(STATUS_CODE.NOT_FOUND).json({ error: `Only ${product.quantity} unit(s) available in stock.
        You already have ${existingCartQuantity} unit(s) of "${product.name}" in your cart.
        — you cannot add more.`,});
    }

    const item = {
      name: product.name,
      brand: product.brand,
      productId: product._id,
      quantity: parsedQuantity,
      basePrice,
      productImage: product.productImage[0],
    };

    const cart = await Cart.findOneAndUpdate(
      { userId, "items.productId": product._id },
      {
        $inc: { "items.$.quantity": quantity },
        $set: { "items.$.basePrice": basePrice },
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
      Wishlist.updateOne(
        { userId: userId },
        { $pull: { product: product._id } }
      ),
      User.findByIdAndUpdate(userId, { $set: { cart: cart?._id } }),
    ]);

    return res
      .status(STATUS_CODE.SUCCESS)
      .json({ message: "Item added to cart successfully!" });
  } catch (error) {
    console.error("Add to cart error:", error.message);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error." });
  }
};

// const updateQuantity = async (req, res) => {

//     const { productId, change } = req.body;
//     const userId = req.session.user?.id ?? req.session.user?._id ?? null;

//     if (!userId) {
//         return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: "User not authenticated" });
//     }
//     if (!productId || ![-1, 1].includes(change)) {
//         return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Invalid product ID or quantity change" });
//     }

//     try {
//         const cart = await Cart.findOne({ userId });
//         if (!cart) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Cart not found" });
//         }

//         const item = cart.items.find((item) =>
//             item.productId.toString() === productId
//         );
//         if (!item) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Product not found in cart" });
//         }

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Product not found" });
//         }

//         if (product.status !== "Available") {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: `Product is ${product.status}` });
//         }

//         // Increase quantity
//         if (change > 0) {
//             if (item.quantity >= product.quantity) {
//                 return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "Product stock limit reached" });
//             }
//             item.quantity += 1;
//             product.quantity -= 1;

//             if (product.quantity === 0) {
//                 product.status = "Out Of Stock";
//             }
//         }

//         // Decrease quantity
//         else if (change < 0) {
//             if (item.quantity <= 1) {
//                 return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "Cannot reduce quantity below 1" });
//             }
//             item.quantity -= 1;
//             product.quantity += 1;

//             if (product.status === "Out Of Stock" && product.quantity > 0) {
//                 product.status = "Available";
//             }
//         }

//         // Business rule: max 5 units
//         if (item.quantity > 5) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "Only 5 units can be purchased in one order." });
//         }

//         await cart.save();
//         await product.save();

//         return res.status(STATUS_CODE.SUCCESS).json({ message: "Quantity updated successfully", cart });
//     } catch (error) {
//         console.error("Error updating quantity:", error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
//     }
// };

const updateQuantity = async (req, res) => {
  const { productId, change } = req.body;
  const userId = req.session.user?.id ?? req.session.user?._id ?? null;

  if (!userId) {
    return res
      .status(STATUS_CODE.UNAUTHORIZED)
      .json({ error: "User not authenticated" });
  }

  if (!productId || ![-1, 1].includes(change)) {
    return res
      .status(STATUS_CODE.NOT_FOUND)
      .json({ error: "Invalid product ID or quantity change" });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!item) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Product not found in cart" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ error: "Product not found" });
    }

    if (product.status !== "Available") {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ error: `Product is ${product.status}` });
    }

    if (change > 0) {
      if (item.quantity >= product.quantity) {
        return res
          .status(STATUS_CODE.BAD_REQUEST)
          .json({ error: "Product stock limit reached" });
      }

      if (item.quantity >= 5) {
        return res
          .status(STATUS_CODE.BAD_REQUEST)
          .json({ error: "Only 5 units can be purchased in one order." });
      }

      item.quantity += 1;
    }

    else if (change < 0) {
      if (item.quantity <= 1) {
        return res
          .status(STATUS_CODE.BAD_REQUEST)
          .json({ error: "Cannot reduce quantity below 1" });
      }

      item.quantity -= 1;
    }

    await cart.save();

    return res
      .status(STATUS_CODE.SUCCESS)
      .json({ message: "Quantity updated successfully", cart });
  } catch (error) {
    console.error("Error updating quantity:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

const deleteFromcart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;

    const cart = await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { items: { productId: productId } } },
      { new: true }
    );

    if (!cart) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ message: "Cart not found" });
    }

    res
      .status(STATUS_CODE.SUCCESS)
      .json({ mesage: "Item deleted from cart successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

export default {
  loadCart,
  addItemToCart,
  updateQuantity,
  deleteFromcart,
};
