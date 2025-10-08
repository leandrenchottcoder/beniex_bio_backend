import express from "express";
import { getFeaturedProducts } from "../controllers/featuredProductsController.js";

const router = express.Router();

router.get("/", getFeaturedProducts);

export default router;