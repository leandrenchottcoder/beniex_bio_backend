import express from "express";
import {
  addCart,
  getCart,
  deleteCart,
  getCartSize,
} from "../controllers/userController.js";
// import { verifyToken } from "../middleware/authJWT.mjs";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  adminDeleteUser,
  adminUpdateUser,
  adminUploadImage,
  getAllProfiles,
  getProfileById,
  getProfile,
  updatePassword,
  updateProfile,
  uploadImage,
  getUsersCharts,
} from "../controllers/profileController.js";
import multer from "multer";

const uploadStructure = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const router = express.Router();

router.get("/view", protect, getProfile);
router.patch("/edit", protect, updateProfile);
router.patch("/password", protect, updatePassword);
router.get("/all", protect, restrictTo("admin"), getAllProfiles);
router.patch(
  "/updateImage",
  protect,
  uploadStructure.fields([{ name: "image", maxCount: 1 }]),
  uploadImage
);
router.patch("/admin/edit", protect, adminUpdateUser);
router.patch(
  "/admin/updateImage",
  protect,
  uploadStructure.fields([{ name: "image", maxCount: 1 }]),
  adminUploadImage
);
router.delete("/admin/delete", protect, adminDeleteUser);
router.get('/charts', protect, getUsersCharts);

router.get("/cart", protect, getCart);
router.post("/cart", protect, addCart);
router.post("/cart/delete", protect, deleteCart);
router.get("/cart/size", protect, getCartSize);
// Dynamic route must come after static routes like /cart to avoid treating 'cart' as an :id
router.get("/:id", protect, getProfileById);
export default router;
