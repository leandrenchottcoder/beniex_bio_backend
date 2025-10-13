import Product from "../models/Product.js";
import CounterProduct from "../models/CounterProduct.js";

/**
 * Get all products in the database paginated.
 */
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page); // Get page number, default to 1
    const limit = parseInt(req.query.limit); // Get limit per page, default to 10

    let products;

    if (page && limit) {
      const skip = (page - 1) * limit; // Calculate documents to skip

      products = await Product.find({}).skip(skip).limit(limit);
    } else {
      products = await Product.find({});
    }

    const totalProducts = await Product.countDocuments(); // Get total count of products

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving products" });
  }
};

/**
 * Create a new product.
 */
export const createProduct = async (req, res) => {
  const { code_product, name, desc, price, reference, stock, category, statut } = req.body;

  try {
    // Helper: get next sequence atomically from Counter collection
    async function getNextSequence(name) {
      const updated = await CounterProduct.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      ).lean();
      return updated.seq;
    }

    const finalCode =
      code_product &&
      typeof code_product === "string" &&
      code_product.trim() !== ""
        ? code_product.trim()
        : `PROD#${String(await getNextSequence("product")).padStart(6, "0")}`;

    const newProduct = new Product({
      code_product: finalCode,
      name,
      desc,
      price,
      reference,
      stock,
      category,
      statut,
    });
    const result = await newProduct.save();
    res
      .status(201)
      .json({ message: "Product Added Successfully", product: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating product" });
  }
};

/**
 * Get a product by its ID.
 */
export const getProductById = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findOne({ _id: productId });
    res.json(product);
  } catch (error) {
    res.status(404).json({ message: "Product not found" });
  }
};

/**
 * Update a product.
 */
export const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const updates = req.body;

  try {
    const result = await Product.updateOne(
      { _id: productId },
      { $set: updates }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product updated", result: result });
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
  }
};

/**
 * Delete a product.
 */
export const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    // Delete product from database
    const result = await Product.deleteOne({ _id: productId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
};

/**
 * Decrease Product Stock
 * @params Array of Object => [{id, quantity}]
 */

export const decreaseProductStock = async (req, res) => {
  try {
    const productsToUpdate = req.body.products;
    console.log(productsToUpdate);

    for (const product of productsToUpdate) {
      const existingProduct = await Product.findOne({ _id: product.id });

      if (!existingProduct) {
        console.log(`Product with ID ${product.id} not found.`);
        continue;
      }

      if (existingProduct.stock < product.quantity) {
        console.log(`Insufficient stock for product with ID ${product.id}.`);
        continue;
      }

      // Decrease the stock
      existingProduct.stock -= product.quantity;

      // Save the updated product
      await existingProduct.save();
      console.log(
        `Stock decreased for product with ID ${product.id}. New stock: ${existingProduct.stock}`
      );
    }

    return res.json({ success: true, message: "Stock updated successfully" });
  } catch (error) {
    // Handle any errors
    console.error("Error decreasing product stock:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while updating stock",
      });
  }
};

/**
 * Get Products count by brand
 * @result [{brand: brand-name, count: num of prods}]
 */

export const getProductCountByCategory = async (req, res) => {
  try {
    // Aggregate products by category (stored as a string on the Product model)
    const result = await Product.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$category", "Unknown"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Return a consistent response shape: [{ category, count }]
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function uploadProductImage(req, res, next) {
  const images = req.files.images;
  let productId = req.body.productId;

  console.log(req.files);

  try {
    if (!productId) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const product = await Product.findOne({ _id: productId });

    for (let i = 0; i < images.length; i++) {
      const base64String = images[i].buffer.toString("base64");
      product.images[i] = base64String;
    }
    await product.save();
    return res.status(200).json({ message: "image uploaded successfully" });
  } catch (error) {
    return res.status(500).json({ error: "failed to upload" });
  }
}
