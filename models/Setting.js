import mongoose from "mongoose";
// Define your schema
const SettingSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, "Phone is required"],
    unique: true,
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Phone must be at least 3 characters long"],
    maxlength: [100, "Phone cannot exceed 100 characters"],
  },
  email: {
    type: String,
    required: false,
    unique: true,
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Email name must be at least 3 characters long"],
    maxlength: [100, "Email name cannot exceed 100 characters"],
  },
   adresse: {
    type: String,
    required: [true, "Adresse name is required"],
    unique: true,
    trim: true, // Trim whitespace from beginning and end
    minlength: [3, "Product name must be at least 3 characters long"],
    maxlength: [300, "Product name cannot exceed 300 characters"],
  },
  temps_ouverture: {
    type: String,
    required: [true, "Temps d'ouverture is required"],
    unique: true,
    trim: true, // Trim whitespace from beginning and end
  },
  facebook_link: {
    type: String,
    required: false,
    unique: true,
    trim: true, // Trim whitespace from beginning and end
  },
  tik_tok_link: {
    type: String,
    required: false,
    unique: true,
    trim: true, // Trim whitespace from beginning and end
  },
   instagram_link: {
    type: String,
    required: false,
    unique: true,
    trim: true, // Trim whitespace from beginning and end
  },
    createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a model
const Setting = mongoose.model("Setting", SettingSchema);
export default Setting;
