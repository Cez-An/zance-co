const addProduct = async (req, res) => {
    try {
        const { name, description, category, basePrice, discount, stock, brand } = req.body;
  
        const imageUrls = req.files.map((file) => file.path || file.url);
  
        const generateProductId = async () => {
            const randomNumber = Math.floor(100000 + Math.random() * 900000);
            const id = `ZNCP${randomNumber}`;
            const ifExists = await Product.findOne({ productId: id });
            if (ifExists) {
                return generateProductId();
            }
            return id;
        };
  
        const categoryFind = await Category.findOne({ name: category });
        if (!categoryFind) {
            return res.status(400).json({ message: "Invalid category" });
        }
        const categoryId = categoryFind._id;
  
        await Category.findOneAndUpdate({ _id: categoryId }, { $inc: { count: 1 } });
  
        const productId = await generateProductId();
  
        const newProduct = new Product({
            name,
            productId,
            category: categoryId,
            description,
            brand,
            salePrice: basePrice,
            productOffer: discount,
            quantity: stock,
            productImage: imageUrls,
        });
  
        await newProduct.save();
        res.redirect("/admin/products");
  
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error saving product", error: error.message });
    }
  };
  