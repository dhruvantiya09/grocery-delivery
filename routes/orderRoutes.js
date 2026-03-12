const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const isHomePage = window.location.pathname === "/";

// ---------------------
// PLACE ORDER (User)
// ---------------------
router.post("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Login required" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let total = 0;
    let items = [];

    for (const item of cart) {
      if (!item.productId || item.qty <= 0) {
        return res.status(400).json({ error: "Invalid cart item" });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: "Product not found" });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          error: `Not enough stock for ${product.name}`
        });
      }

      total += product.price * item.qty;

      items.push({
        product: product._id,
        qty: item.qty,
        price: product.price
      });

      product.stock -= item.qty;
      await product.save();
    }

    const order = new Order({
      user: user._id,
      items,
      totalAmount: total,
      customerName: user.name,
      phone: user.phone,
      address: user.address,
      status: "Pending"
    });

    await order.save();

    res.json({ success: true, order });

  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ error: "Order failed" });
  }
});


// ---------------------
// GET ALL ORDERS (ADMIN)
// ---------------------
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(4); // 🔥 only 4 products

    res.render("home", { products });

  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

router.get("/admin/Orders", async (req, res) => {
  try {
    if (!req.session.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("items.product", "name price");

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


module.exports = router;
