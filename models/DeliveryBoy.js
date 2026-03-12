const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,

  isActive: {
    type: Boolean,
    default: true
  },

  isAvailable: {
    type: Boolean,
    default: true
  },

  location: {
    lat: Number,
    lng: Number
  }
});

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);
