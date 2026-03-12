const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { isLoggedIn } = require("../middleware/auth");

router.post("/start-payment", isLoggedIn, (req, res) => {
  const cart = req.body.cart;

  if (!cart || cart.length === 0) {
    return res.json({
      success: false,
      message: "Your cart is empty"
    });
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  req.session.pendingOrder = {
    items: cart,
    totalAmount
  };

  return res.json({ success: true });
});

// place

router.post("/place", isLoggedIn, async (req, res) => {
  try {
    let cart = req.session.cart;

    // 🔥 If session cart empty, use direct cart from frontend
    if (!cart || cart.length === 0) {
      if (req.body.cart && req.body.cart.length > 0) {
        cart = req.body.cart;
      } else {
        return res.json({ success: false, message: "Cart is empty" });
      }
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // 🔥 If coming from direct order, we need product details
    const formattedItems = [];

    for (let item of cart) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        formattedItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          qty: item.qty,
          image: product.image
        });
      } else {
        // session cart structure
        formattedItems.push(item);
      }
    }

    const totalAmount = formattedItems.reduce((sum, item) => {
      return sum + item.price * item.qty;
    }, 0);

    const paymentMethod = req.body.paymentMethod || "Online";

await Order.create({
  user: req.session.userId,
  items: formattedItems,
  totalAmount,
  paymentMethod:
    paymentMethod === "Cash"
      ? "Cash on Delivery"
      : "Online Payment",
  customerName: user.name,
  phone: user.phone,
  address: user.address,
  status: "Pending"
});

    req.session.cart = [];

    return res.json({ success: true });

  } catch (err) {
    console.error("Order error:", err);
    return res.status(500).json({ success: false });
  }
});


router.get("/delete/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.redirect("/my-orders");
    }

    // Optional: check if order belongs to logged user
    if (order.user.toString() !== req.session.userId) {
      return res.redirect("/my-orders");
    }

    await Order.findByIdAndDelete(req.params.id);

    res.redirect("/my-orders");

  } catch (err) {
    console.error(err);
    res.redirect("/my-orders");
  }
});

module.exports = router;
