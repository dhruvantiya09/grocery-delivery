const express = require("express");
const router = express.Router();
exports.router = router;

const Order = require("../models/Order");
const Staff = require("../models/Staff");
const Expense = require("../models/Expense");
const Complaint = require("../models/Complaint");
const authRoutes = require("./auth");
const adminAuth = require("../middleware/adminAuth");
const DeliveryBoy = require("../models/DeliveryBoy");



router.post("/update-status/:id", async (req, res) => {
  const { status } = req.body;

  await Order.findByIdAndUpdate(req.params.id, {
    status: status
  });

  res.redirect("/admin/dashboard");
});



router.get("/expenses", async (req, res) => {
  const expenses = await Expense.find().sort({ createdAt: -1 });
  res.render("admin/expenses", { expenses });
});

router.post("/expenses/add", async (req, res) => {
  const { title, amount } = req.body;

  await Expense.create({
    title,
    amount
  });

  res.redirect("/admin/expenses");
});

router.get("/staff", async (req, res) => {
  const staff = await Staff.find().sort({ joinedAt: -1 });
  res.render("admin/staff", { staff });
});

router.post("/staff/add", async (req, res) => {
  const { name, role, salary, workTime, phone } = req.body;

  await Staff.create({
    name,
    role,
    salary,
    workTime,
    phone
  });

  res.redirect("/admin/staff");
});

router.post("/staff/delete/:id", async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.redirect("/admin/staff");
});

router.post("/staff/deduct/:id", async (req, res) => {
  const { amount } = req.body;

  await Staff.findByIdAndUpdate(req.params.id, {
    $inc: { deduction: amount }
  });

  res.redirect("/admin/staff");
});


// 🔐 Dashboard
router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const complaints = await Complaint.find().sort({ createdAt: -1 });
    const staff = await Staff.find();
    const expenses = await Expense.find();

    const revenue = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    const staffExpense = staff.reduce(
      (sum, s) => sum + (s.salary - (s.deduction || 0)),
      0
    );

    const otherExpense = expenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const totalExpense = staffExpense + otherExpense;
    const profit = revenue - totalExpense;

    res.render("admin/dashboard", {
      orders,
      complaints,
      revenue,
      profit,
      totalExpense
    });

  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res.render("admin/dashboard", {
      orders: [],
      complaints: [],
      revenue: 0,
      profit: 0,
      totalExpense: 0
    });
  }
});

// 🔐 Login
router.get("/login", (req, res) => {
  res.render("admin/login");
});

const bcrypt = require("bcrypt");
const User = require("../models/User"); // we will create this if not exists

router.post("/login", async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("admin/login", { error: "User not found" });
    }

    if (user.role !== "admin") {
      return res.render("admin/login", { error: "Not authorized" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("admin/login", { error: "Invalid password" });
    }

    req.session.admin = user._id;
    if (remember) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }
    return res.redirect("/admin/dashboard");

  } catch (err) {
    console.error(err);
    return res.render("admin/login", { error: "Something went wrong" });
  }
});


// 🔐 Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

// 🗑 Delete Order
router.post("/order/delete/:id", async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.redirect("/admin/dashboard");
});

// 🗑 Delete Complaint
router.post("/complaint/delete/:id", async (req, res) => {
  await Complaint.findByIdAndDelete(req.params.id);
  res.redirect("/admin/dashboard");
});

// Delete Expense
router.post("/expenses/delete/:id", async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.redirect("/admin/expenses");
});

// Edit Expense Page
router.get("/expenses/edit/:id", async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  res.render("admin/edit-expense", { expense });
});

// Update Expense
router.post("/expenses/update/:id", async (req, res) => {
  const { title, amount } = req.body;

  await Expense.findByIdAndUpdate(req.params.id, {
    title,
    amount
  });

  res.redirect("/admin/expenses");
});

router.post("/delivered/:id", async (req, res) => {

  const order = await Order.findById(req.params.id);

  const deliveryBoy = await DeliveryBoy.findById(order.deliveryBoy);

  order.status = "Delivered";
  await order.save();

  deliveryBoy.isAvailable = true;
  await deliveryBoy.save();

  res.redirect("/delivery/dashboard");
});

router.post("/assign-delivery/:orderId", async (req, res) => {
  const { deliveryBoyId } = req.body;

  const order = await Order.findById(req.params.orderId);

  order.deliveryBoy = deliveryBoyId;
  order.status = "Confirmed";

  await order.save();

  res.redirect("/admin/dashboard");
});

router.get("/complaints", async (req, res) => {
  const complaints = await Complaint.find().sort({ createdAt: -1 });
  const resolved = req.query.resolved;

  res.render("admin-complaints", { complaints, resolved });
});

router.get("/analytics", async (req, res) => {

  const orders = await Order.find().populate("user");
  const expenses = await Expense.find();

  let fruitMap = {};
  let dailyRevenue = {};
  let monthlyRevenue = {};
  let statusMap = {};
  let customerMap = {};

  /* WEEKLY SALES */

  const weeklySales = {};

  for (let i = 6; i >= 0; i--) {

    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    weeklySales[key] = 0;

  }

  orders.forEach(order => {

    const key = order.createdAt.toISOString().slice(0, 10);

    if (weeklySales[key] !== undefined) {
      weeklySales[key] += order.totalAmount;
    }

  });

  const today = new Date();
  let todaySales = 0;
  let monthSales = 0;
  let yearSales = 0;

  orders.forEach(order => {

    const date = new Date(order.createdAt);
    const day = date.toISOString().split("T")[0];
    const month = date.getFullYear() + "-" + (date.getMonth() + 1);
    const weeklySales = {};

    // revenue by day
    dailyRevenue[day] = (dailyRevenue[day] || 0) + order.totalAmount;

    // revenue by month
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.totalAmount;

    // fruit stats
    order.items.forEach(item => {
      fruitMap[item.name] = (fruitMap[item.name] || 0) + item.qty;
    });

    // order status
    statusMap[order.status] = (statusMap[order.status] || 0) + 1;

    // customers
    if (order.user) {
      const name = order.user.name;
      customerMap[name] = (customerMap[name] || 0) + order.totalAmount;
    }

    // today / month / year
    if (date.toDateString() === today.toDateString()) {
      todaySales += order.totalAmount;
    }

    if (date.getMonth() === today.getMonth()) {
      monthSales += order.totalAmount;
    }

    if (date.getFullYear() === today.getFullYear()) {
      yearSales += order.totalAmount;
    }

  });

  res.render("admin-analytics", {
    fruitMap,
    dailyRevenue,
    monthlyRevenue,
    statusMap,
    customerMap,
    todaySales,
    monthSales,
    yearSales,
    weeklySales
  });

});

// Resolve complaint
router.post("/complaint/resolve/:id", async (req, res) => {

  await Complaint.findByIdAndUpdate(req.params.id, {
    status: "Resolved"
  });

  res.redirect("/admin/complaints?resolved=true");

});

module.exports = router;
