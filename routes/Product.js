const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // make sure the path is correct

// GET /products - return all products as JSON
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({}); // fetch all products
    res.json(products); // send as JSON
  } catch (err) {
    console.error("Failed to fetch products:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
