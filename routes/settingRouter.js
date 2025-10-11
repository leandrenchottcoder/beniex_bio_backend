import express from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  addSetting,
  deleteSetting,
  updateSetting,
  getAllSetting,
  getSettingById
} from "../controllers/settingController.js";

const router = express.Router();


router.post("/save", protect, restrictTo("admin"), addSetting);
router.get("/all", protect, getAllSetting);
router.get("/:id", protect, restrictTo("admin"), getSettingById);
router.patch("/:id", protect, restrictTo("admin"), updateSetting);
router.delete("/delete", protect, restrictTo("admin"), deleteSetting);

export default router;