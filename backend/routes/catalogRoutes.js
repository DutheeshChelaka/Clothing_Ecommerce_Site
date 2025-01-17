const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

console.log("authMiddleware:", authMiddleware); // Should log the function
console.log("adminMiddleware:", adminMiddleware); // Should log the function

// ---------------------------
// CATEGORY ROUTES
// ---------------------------

// Create a new category
router.post(
  "/categories",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    const { name } = req.body;
    try {
      const category = new Category({ name });
      await category.save();
      res.status(201).json({ message: "Category created", category });
    } catch (error) {
      console.error("Error creating category:", error.message);
      res.status(500).json({ message: "Error creating category", error });
    }
  }
);

// Fetch all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ message: "Error fetching categories", error });
  }
});

// Delete a category and its subcategories
router.delete(
  "/categories/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const categoryId = req.params.id;

      // Delete the category
      const category = await Category.findByIdAndDelete(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Delete associated subcategories
      await Subcategory.deleteMany({ category: categoryId });

      res.json({
        message: "Category and related subcategories deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting category:", error.message);
      res.status(500).json({ message: "Error deleting category", error });
    }
  }
);

// ---------------------------
// SUBCATEGORY ROUTES
// ---------------------------

// Create a new subcategory
router.post(
  "/subcategories",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    const { name, categoryId } = req.body;
    try {
      const subcategory = new Subcategory({ name, category: categoryId });
      await subcategory.save();
      res.status(201).json({ message: "Subcategory created", subcategory });
    } catch (error) {
      console.error("Error creating subcategory:", error.message);
      res.status(500).json({ message: "Error creating subcategory", error });
    }
  }
);

// Fetch all subcategories for a category
router.get("/subcategories/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const subcategories = await Subcategory.find({ category: categoryId });
    if (!subcategories.length) {
      return res.status(404).json({ message: "No subcategories found" });
    }
    res.status(200).json(subcategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error.message);
    res.status(500).json({ message: "Error fetching subcategories", error });
  }
});

// Delete a subcategory
router.delete(
  "/subcategories/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const subcategoryId = req.params.id;
      const subcategory = await Subcategory.findByIdAndDelete(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      res.json({ message: "Subcategory deleted successfully" });
    } catch (error) {
      console.error("Error deleting subcategory:", error.message);
      res.status(500).json({ message: "Error deleting subcategory", error });
    }
  }
);

// ---------------------------
// PRODUCT ROUTES
// ---------------------------

const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique file names
  },
});

const upload = multer({ storage: storage });
// Create a new product
// Route for creating a product with multiple images
router.post("/products", upload.array("images", 5), async (req, res) => {
  try {
    const { name, price, description, categoryId, subcategoryId, sizes } =
      req.body;

    const parsedSizes = sizes ? JSON.parse(sizes) : []; // Parse the sizes array

    const images = req.files.map((file) => file.path); // Save image paths

    const product = new Product({
      name,
      price,
      description,
      category: categoryId,
      subcategory: subcategoryId,
      sizes: parsedSizes,
      images,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product", error });
  }
});

// Fetch products based on optional subcategoryId query parameter
router.get("/products", async (req, res) => {
  const { subcategory } = req.query; // Get subcategory from query
  const filter = {};

  if (subcategory) {
    filter.subcategory = subcategory;
  }

  try {
    const products = await Product.find(filter)
      .populate("category")
      .populate("subcategory");
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Error fetching products", error });
  }
});

// Update a product
router.put(
  "/products/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    const { name, price, description, categoryId, subcategoryId, imageUrl } =
      req.body;
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          name,
          price,
          description,
          category: categoryId,
          subcategory: subcategoryId,
          imageUrl,
        },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error.message);
      res.status(500).json({ message: "Error updating product", error });
    }
  }
);

// Delete a product
router.delete(
  "/products/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error.message);
      res.status(500).json({ message: "Error deleting product", error });
    }
  }
);

router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("subcategory");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
