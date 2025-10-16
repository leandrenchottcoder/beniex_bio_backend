import express from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import upload from "../utils/upload.js";
import {
  addBlog,
  deleteBlog,
  updateBlog,
  getAllBlog,
  getBlogById,
} from "../controllers/blogController.js";

const router = express.Router();


// Expect form-data with field name 'images' for files (can send multiple)
router.post("/save", protect, restrictTo("admin"), upload.array('images'), addBlog);
router.get("/all", getAllBlog);
router.get("/:id", protect, getBlogById);
router.patch("/:id", protect, restrictTo("admin"), updateBlog);
router.delete("/delete", protect, restrictTo("admin"), deleteBlog);

export default router;