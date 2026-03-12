const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: String,
  description: String,
  stock: { type: Number, default: 100 },
  ratings:[
{
user:{ type: mongoose.Schema.Types.ObjectId, ref:"User" },
rating:Number
}
]
});


// Check if the model already exists
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);