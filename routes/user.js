const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { isLoggedIn } = require("../middleware/auth");

router.post("/add/:id", isLoggedIn, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.redirect("/shop");
    }

    // If cart doesn't exist, create it
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if product already in cart
    const existingItem = req.session.cart.find(
      item => item._id.toString() === product._id.toString()
    );

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      req.session.cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1
      });
    }

    res.redirect("/shop");

  } catch (err) {
    console.error(err);
    res.redirect("/shop");
  }
});


// ---------------------
// Cancel Order
// ---------------------
router.post("/Order/cancel/:id", isLoggedIn, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/my-orders?error=Invalid order ID");
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.userId
    }).populate("items.product");

    if (!order) {
      return res.redirect("/my-orders?error=Unauthorized");
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.redirect("/my-orders?error=Cannot cancel this order");
    }

    // 🔄 Restore stock when cancelling
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      product.stock += item.qty;
      await product.save();
    }

    order.status = "Cancelled";
    await order.save();

    res.redirect("/my-orders");

  } catch (err) {
    console.error("Cancel Error:", err);
    res.redirect("/my-orders?error=Server error");
  }
});

// ---------------------
// Confirm Order
// ---------------------
router.post("/Order/confirm/:id", isLoggedIn, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/my-orders?error=Invalid order ID");
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.userId
    });

    if (!order) {
      return res.redirect("/my-orders?error=Unauthorized");
    }

    if (order.status !== "Pending") {
      return res.redirect("/my-orders?error=Order cannot be confirmed");
    }

    order.status = "Confirmed";
    await order.save();

    res.redirect("/my-orders");

  } catch (err) {
    console.error("Confirm Error:", err);
    res.redirect("/my-orders?error=Server error");
  }
});


// ---------------------
// My Orders
// ---------------------
router.get("/my-orders", isLoggedIn, async (req, res) => {
  console.log("route hits")
  try {

    const orders = await Order.find({
      user: req.session.userId
    })
    .sort({ createdAt: -1 })
    .populate("deliveryBoy")
    .populate({
      path: "items.product",
      model: "Product"
    });

    console.log("DeliveryBoy Data:", orders[0]?.deliveryBoy);

    res.render("my-orders", {
      orders,
      error: req.query.error || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ---------------------
// Order Details
// ---------------------
router.get("/Order/:id", isLoggedIn, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/my-orders?error=Invalid order ID");
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.userId
    }).populate("items.product");

    if (!order) {
      return res.redirect("/my-orders?error=Order not found");
    }

    res.render("order-details", { order });

  } catch (err) {
    res.redirect("/my-orders?error=Server error");
  }
});


// ---------------------
// Checkout Page
// ---------------------
router.get("/checkout", isLoggedIn, (req, res) => {
  res.render("checkout");
});

router.get("/confirm-address", isLoggedIn, async (req, res) => {

  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.redirect("/shop");
  }

  const user = await User.findById(req.session.userId);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  res.render("confirm-address", {
    user,
    cart,
    total
  });
});



// ---------------------
// Profile Page
// ---------------------
router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("profile", { user });
  } catch (err) {
    res.redirect("/");
  }
});


// ---------------------
// Update Profile
// ---------------------
router.post("/profile/update", isLoggedIn, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      const user = await User.findById(req.session.userId);
      return res.render("profile", {
        user,
        error: "Phone must be exactly 10 digits and numbers only"
      });
    }

    // Check if email already exists (but not the same user)
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.session.userId }
    });

    if (existingUser) {
      const user = await User.findById(req.session.userId);
      return res.render("profile", {
        user,
        error: "Email already in use"
      });
    }

    await User.findByIdAndUpdate(req.session.userId, {
      name,
      email,
      phone,
      address
    });

    res.redirect("/profile");

  } catch (err) {
    console.error(err);
    res.redirect("/profile");
  }
});


router.post("/Order/delete/:id", isLoggedIn, async (req, res) => {
  try {
    await Order.findOneAndDelete({
      _id: req.params.id,
      user: req.session.userId
    });

    res.redirect("/my-orders");

  } catch (err) {
    console.error(err);
    res.redirect("/my-orders");
  }
});

// Example route for the full shop page
router.get("/shop", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 });   // no limit
    const categories = [
    ...new Set(products.map(p => p.category))
  ];

      products.forEach(p => {
  console.log(p.name, p.category);
});

console.log("Products:", products);

    res.render("shop", {
      products,
      categories: categories.map(c => ({ name: c }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load shop page");
  }
});

router.get("/api/home-products", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(4);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/cart", isLoggedIn, (req, res) => {
  const cart = req.session.cart || [];

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  res.render("cart", { cart, totalAmount });
});


router.get("/payment", isLoggedIn, (req, res) => {
  if (!req.session.pendingOrder) {
    return res.redirect("/my-orders");
  }

  res.render("payment", {
    totalAmount: req.session.pendingOrder.totalAmount
  });
});

router.get("/api/search", async (req,res)=>{

const q = req.query.q;

const products = await Product.find({
name: { $regex: q, $options: "i" }
}).limit(5);

res.json(products);

});

router.post("/rate/:id", async(req,res)=>{

const product = await Product.findById(req.params.id);

product.ratings.push({
user:req.session.userId,
rating:req.body.rating
});

await product.save();

res.redirect("/shop");

});

router.post("/wishlist/:id", async(req,res)=>{

const user = await User.findById(req.session.userId);

user.wishlist.push(req.params.id);

await user.save();

res.redirect("/shop");

});

module.exports = router;