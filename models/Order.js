import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  code_order : {
    type: String,
    required: [true, "Code is required"], // Custom error message
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Code must be at least 3 characters long"],
    maxlength: [100, "Code cannot exceed 100 characters"],
    unique: true,
  },
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  address: {
    type: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      zip: { type: String, required: true },
    },
    required: true,
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
}, {timestamps: true});

const Order = mongoose.model("Order", orderSchema);
export default Order;
