const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { isLoggedIn } = require("../middleware/auth");

router.post("/remove/:index", (req, res) => {
  try {

    const index = req.params.index;

    if (!req.session.cart) {
      return res.redirect("/cart");
    }

    req.session.cart.splice(index, 1);

    res.redirect("/confirm-address");

  } catch (err) {
    console.error(err);
    res.send("Error removing item");
  }
});

router.post("/update-qty", (req, res) => {
  try {

    const { index, qty } = req.body;

    if (!req.session.cart) {
      return res.json({ success: false });
    }

    if (req.session.cart[index]) {
      req.session.cart[index].qty = Math.max(1, parseInt(qty));
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

router.post("/add/:id", isLoggedIn, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);

    if (!product) {
      return res.redirect("/shop?error=Product not found");
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const existingItem = req.session.cart.find(
      item => item.product.toString() === product._id.toString()
    );

    if (existingItem) {
      existingItem.qty += quantity;
    } else {
      req.session.cart.push({
        product: product._id,
        name: product.name,
        price: product.price,
        qty: quantity,
        image: product.image
      });
    }

    res.redirect("/shop?success=Added to cart");

  } catch (err) {
    console.error(err);
    res.redirect("/shop?error=Server error");
  }
});

module.exports = router;