import express from "express";
import { 
    getAllProducts, 
    createProduct, 
    getProductById, 
    updateProduct, 
    deleteProduct, 
    decreaseProductStock, 
    getProductCountByCategory, 
    uploadProductImage } from '../controllers/productController.js';
import multer from "multer";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

const uploadStructure = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

router.get("/", getAllProducts);
router.post("/", protect, restrictTo("admin"), createProduct);
router.get('/product-counts-by-category', getProductCountByCategory);
router.get("/:id", getProductById);
router.put("/:id", protect, restrictTo("admin"), updateProduct);
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);
router.post("/decrease-stock", decreaseProductStock);

router.patch(
    "/updateImage",
    protect,
    uploadStructure.fields([{ name: "images", maxCount: 5 }]),
    uploadProductImage
);

export default router;