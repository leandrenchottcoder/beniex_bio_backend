import express from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  addSupport,
  deleteSupport,
  updateSupport,
  getAllSupport,
  getSupportById
} from "../controllers/supportController.js";

const router = express.Router();


router.post("/save", addSupport);
router.get("/all", protect, restrictTo("admin"), getAllSupport);
router.get("/:id", protect, restrictTo("admin"), getSupportById);
router.patch("/:id", protect, restrictTo("admin"), updateSupport);
router.delete("/delete", protect, restrictTo("admin"), deleteSupport);

export default router;