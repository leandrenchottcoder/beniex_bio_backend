import express from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  addCategory,
  adminDeleteCategory,
  adminUpdateCategory,
  getAllCategory,
  getCategoryById
} from "../controllers/categoryController.js";

const router = express.Router();


router.post("/save", protect, restrictTo("admin"), addCategory);
router.get("/all", protect, getAllCategory);
router.get("/:id", protect, restrictTo("admin"), getCategoryById);
router.patch("/:id", protect, restrictTo("admin"), adminUpdateCategory);
router.delete("/delete", protect, restrictTo("admin"), adminDeleteCategory);

export default router;