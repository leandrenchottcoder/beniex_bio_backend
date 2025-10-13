import mongoose from "mongoose";
// Define your schema
const SupportSchema = new mongoose.Schema({
  code_support: {
    type: String,
    required: [true, "Code is required"], // Custom error message
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Code must be at least 3 characters long"],
    maxlength: [100, "Code cannot exceed 100 characters"],
    unique: true,
  },
  nom_complet: {
    type: String,
    required: [true, "Name is required"], // Custom error message
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Name must be at least 3 characters long"],
    maxlength: [100, "Name cannot exceed 100 characters"],
  },
  phone: {
    type: String,
    required: [true, "Téléphone is required"], // Custom error message
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Téléphone must be at least 3 characters long"],
    maxlength: [100, "Téléphone cannot exceed 100 characters"],
  },
  email: {
    type: String,
    required: false,
    trim: true, // Trim whitespace from beginning and end
  },
  message: {
    type: String,
    required: [true, "Message is required"], // Custom error message
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Message must be at least 3 characters long"],
    maxlength: [500, "Message cannot exceed 500 characters"],
  },
  statut: {
    type: Number,
    required: [true, " Status is required"],
    default: 0,
  }
}, {timestamps: true});

// Create a model
const Support = mongoose.model("Support", SupportSchema);
export default Support;
