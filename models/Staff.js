const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: String,
  role: String,
  salary: Number,
  deduction: {
    type: Number,
    default: 0
  },
  workTime: String,
  phone: String,
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Staff", staffSchema);
