import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// body-parser is not required because express has built-in parsers.
// We'll configure express.json / express.urlencoded with larger limits below

import appError from "./utils/appError.js";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import orderRouter from "./routes/orderRouter.js";
import productRouter from "./routes/productRouter.js";
import featuredProductsRouter from "./routes/featuredProductsRouter.js";
import categoryRouter from "./routes/categoryRouter.js";
import blogRouter from "./routes/blogRouter.js";
import { protect } from "./controllers/authController.js";
import cors from "cors";

process.on("uncaughtException", (err) => {
  console.log("uncaught exception ... shutting down");
  console.log(err.name, err.message);
  process.exit(1);
});



const app = express();

// Configure body parsers with larger limits to allow bigger payloads
// (e.g. base64 images sent in JSON). Prefer multipart/form-data + multer
// for file uploads, but increase limits here to handle cases where the
// client sends image data inside JSON.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
dotenv.config({ path: "./.env" });
// app.use(cors());
app.use(
  cors({
    credentials: true,
    optionsSuccessStatus: 200,
    origin: ["http://localhost:4200"],
  })
);

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

process.on("unhandledRejection", (error) => {
  console.log("unhandledRejection", error.message);
});

// Note: express.json / express.urlencoded already configured above with limits.
app.use("/api/users", authRouter);
app.use("/api/users", userRouter);
app.use("/api/profile", userRouter);
app.use("/api/orders", protect, orderRouter);
app.use("/api/products", productRouter);
app.use("/api/featuredproducts", featuredProductsRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/blogs", blogRouter);

const server = app.listen(PORT, () => {
  console.log(`Listening on http://127.0.0.1:${PORT}`);
});

// 404 handler for unknown routes — use app.use without a path to avoid compiling a route pattern
app.use((req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on this server`));
});

// HANDLE UNHANDLED REJECTED PROMISES
process.on("unhandledRejection", (err) => {
  console.log("unhandled rejection ... shutting down");
  console.log(err.name, err.message);
  // 0 : success , 1 : uncaught exception
  server.close(() => {
    process.exit(1);
  });
});
