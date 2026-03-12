const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

// Add Complaint
router.post("/add", async (req, res) => {
  try {
    const { type, orderId, priority, preferredContact, message } = req.body;

    // Basic validation
    if (!type || !priority || !message) {
      return res.redirect("/?error=Missing required fields");
    }

    const newComplaint = new Complaint({
      type,
      orderId: orderId || null,
      priority,
      preferredContact: preferredContact || "Not provided",
      message
    });

    await newComplaint.save();

    res.redirect("/admin/dashboard?success=Complaint added");
  } catch (err) {
    console.error("❌ Complaint Save Error:", err);
    res.redirect("/admin/dashboard?error=Server error");
  }
});

module.exports = router;
