const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const session = require("express-session");
const MongoStore = require("connect-mongo");

dotenv.config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/groceryDB')
  .catch(err => console.log(err));


  // Session
  app.use(
  session({
    secret: "grocery-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/groceryDB"
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Routes
const userRoutes = require("./routes/user");
const adminRoutes = require('./routes/admin');
const complaintRoutes = require("./routes/complaint");
const orderRoutes = require("./routes/order");
const authRoutes = require("./routes/auth");
const Order = require("./models/Order");
const User = require("./models/User");
const cartRoutes = require("./routes/cart");
const Product = require("./models/Product");
const productRoute = require("./routes/product");
const deliveryRoutes = require("./routes/delivery");


// Mount routes
app.use("/", authRoutes);
app.use('/admin', adminRoutes);
app.use("/complaint", complaintRoutes);
app.use("/", userRoutes);
app.use("/order", orderRoutes);
app.use("/cart", cartRoutes);
app.use("/products", productRoute);
app.use("/delivery", deliveryRoutes);


// Home route
app.get("/", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const userOrders = await Order.find({
    user: req.session.userId
  });

  const user = await User.findById(req.session.userId);

  const products = await Product.find() || [];
    res.render("index", { orderCount: userOrders.length, user, products });
});

// Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));