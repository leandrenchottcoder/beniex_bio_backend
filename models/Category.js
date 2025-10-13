import mongoose from "mongoose";
// Define your schema
const CategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, "Category name is required"], // Custom error message
    unique: true,
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Category name must be at least 3 characters long"],
    maxlength: [100, "Category name cannot exceed 100 characters"],
  },
  is_Published: {
    type: Number,
    required: [true, " Status is required"],
    default: 1,
  }
}, {timestamps: true});

// Create a model
const Category = mongoose.model("Category", CategorySchema);
export default Category;
