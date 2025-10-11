import mongoose from "mongoose";
// Define your schema
const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title name is required"], // Custom error message
    unique: true,
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Title name must be at least 3 characters long"],
    maxlength: [100, "Title name cannot exceed 100 characters"],
  },
   description: {
    type: String,
    required: [true, "Description name is required"], // Custom error message
    trim: true, // Trim whitespace from beginning and end
    minlength: [10, "Description name must be at least 10 characters long"],
    maxlength: [500, "Description name cannot exceed 500 characters"],
  },
  images: {
    type: [String], // Ensure at least one image URL is provided
  },
  is_Published: {
    type: Number,
    required: [true, " Status is required"],
    default: 1,
  },
    createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a model
const Blog = mongoose.model("Blog", BlogSchema);
export default Blog;
