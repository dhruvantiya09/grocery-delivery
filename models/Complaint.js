// const mongoose = require('mongoose');

// const complaintSchema = new mongoose.Schema({
//   type: String,
//   orderId: String,
//   priority: String,
//   message: String,
//   status: { type: String, default: "Open" },
//   createdAt: { type: Date, default: Date.now }
// });

// const express = require('express');
// const router = express.Router();
// const Complaint = require('../models/Complaint');

// router.post('/complaint', async (req, res) => {
//   const { type, priority, message } = req.body;

//   await Complaint.create({
//     type,
//     priority,
//     message
//   });

//   res.redirect('/admin');
// });

// module.exports = router;


// module.exports = mongoose.model('Complaint', complaintSchema);

const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  type: String,
  orderId: String,
  priority: String,
  preferredContact: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);
