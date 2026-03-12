const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Order = require("../models/Order");

// ---------------------
// Cancel Order
// ---------------------
router.post("/order/cancel/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.userId
    });

    if (!order) {
      return res.redirect("/my-orders?error=Unauthorized");
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.redirect(
        `/my-orders?error=Cannot cancel ${order.status.toLowerCase()} order`
      );
    }

    order.status = "Cancelled";
    await order.save();

    res.redirect("/my-orders");
  } catch (err) {
    console.error("❌ Cancel order error:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------
// Show Register Page
// ---------------------
router.get("/register", (req, res) => {
  res.render("register", { error: null, old: {} });
});


// ---------------------
// Show Login Page
// ---------------------
router.get("/login", (req, res) => {
  res.render("login", { error: null, errorField: null });
});

// ---------------------
// REGISTER
// ---------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone) {
      return res.render("register", {
        error: "All fields are required",
        errorField: null,
        old: { name, email, phone, address }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  return res.render("register", {
    error: "Please enter a valid email address",
    errorField: "email",
    old: { name, phone, address }
  });
}

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.render("register", {
        error: "Phone must be exactly 10 digits and numbers only",
        errorField: "phone",
        old: { name, email, address }  // ❌ no phone
      });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.render("register", {
        error: "Password must contain at least 1 capital letter, 1 number, and 1 special symbol",
        errorField: "password",
        old: { name, email, phone, address }
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", {
        error: "User already exists",
        errorField: "email",
        old: { name, phone, address }  // ❌ no email
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address
    });

    res.redirect("/login");

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("Server error");
  }
});



// ---------------------
// LOGIN
// ---------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", { error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("login", { error: "Wrong password" });
    }

    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------
// LOGOUT
// ---------------------
router.post("/logout", (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.error(err);
        return res.send("Error logging out");
      }
      res.redirect("/login");
    });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------
// My Orders (user)
// ---------------------
router.get("/my-orders", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const orders = await Order.find({ user: req.session.userId })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price img"); // optional: show product info

    res.render("my-orders", {
      orders,
      error: req.query.error || null
    });
  } catch (err) {
    console.error("❌ My orders error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
