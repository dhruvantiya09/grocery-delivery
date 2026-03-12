const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,

   phone: {
    type: String,
    default: ""
  },

  address: {
    type: String,
    default: ""
  },

  role: {
    type: String,
    default: "user"
  },

  wishlist:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"Product"
}
],

profileImage:{
  type:String,
  default:"/images/default-avatar.png"
},

  createdAt: {
    type: Date,
    default: Date.now
  }
},{ timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);