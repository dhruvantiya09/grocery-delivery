const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  paymentId: String,
  paymentStatus: {
  type: String,
  default: "Paid"
},

  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      },
      name: String,        // snapshot
      price: Number,       // snapshot
      qty: Number,
      image: String
    }
  ],

  totalAmount: Number,

  paymentMethod: {
    type: String,
    default: "COD"
  },

  customerName: String,
  address: String,
  phone: String,

  status: {
    type: String,
    default: "Pending"
  },

  deliveryBoy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "DeliveryBoy",
  default: null
},

deliveryLocation: {
  lat: Number,
  lng: Number
},

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
