const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const DeliveryBoy = require("../models/DeliveryBoy");

// Middleware to check delivery login
function isDeliveryLoggedIn(req, res, next) {
  if (!req.session.deliveryId) {
    return res.redirect("/delivery/login");
  }
  next();
}

// ======================
// Delivery Login Page
// ======================
router.get("/login", (req, res) => {
  res.render("delivery-login");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const deliveryBoy = await DeliveryBoy.findOne({ email });

  if (!deliveryBoy || deliveryBoy.password !== password) {
    return res.render("delivery-login", { error: "Invalid credentials" });
  }

  req.session.deliveryId = deliveryBoy._id;
  res.redirect("/delivery/available-orders");
});

// ======================
// Dashboard
// ======================
router.get("/dashboard", isDeliveryLoggedIn, async (req, res) => {
  const orders = await Order.find({
    deliveryBoy: req.session.deliveryId,
    status: { $in: ["Confirmed", "Out for Delivery"] }
  }).populate("user")
   .populate("deliveryBoy");

  res.render("delivery-dashboard", { orders });
});

// ======================
// Mark Out for Delivery
// ======================
router.post("/out-for-delivery/:id", isDeliveryLoggedIn, async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, {
    status: "Out for Delivery"
  });

  res.redirect("/delivery/dashboard");
});

// ======================
// Mark Delivered
// ======================
router.post("/delivered/:id", isDeliveryLoggedIn, async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, {
    status: "Delivered"
  });

  res.redirect("/delivery/dashboard");
});

// Show available orders
router.get("/available-orders", isDeliveryLoggedIn, async (req, res) => {
  const orders = await Order.find({ status: "Pending" })
    .populate("user")
    .populate("deliveryBoy");

  res.render("delivery/available-orders", { orders });
});

// Accept order
router.post("/accept-order/:id", async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, {
    deliveryBoy: req.session.deliveryId,
    status: "Confirmed"
  });

  res.redirect("/delivery/available-orders");
});

module.exports = router;