import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import appError from "./utils/appError.js";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import orderRouter from "./routes/orderRouter.js";
import productRouter from "./routes/productRouter.js";
import featuredProductsRouter from "./routes/featuredProductsRouter.js";
import categoryRouter from "./routes/categoryRouter.js";
import blogRouter from "./routes/blogRouter.js";
import settingRouter from "./routes/settingRouter.js";
import supportRouter from "./routes/supportRouter.js";
import { protect } from "./controllers/authController.js";

// Configuration
dotenv.config({ path: "./.env" });
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || "development";

// Application express
const app = express();

// Configure body parsers with larger limits to allow bigger payloads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Configuration CORS
app.use(
  cors({
    credentials: true,
    optionsSuccessStatus: 200,
    origin: [
      "http://localhost:4200",
      "https://beniexbio.com",
      "https://admin.beniexbio.com",
      "https://manager.beniexbio.com",
      "http://72.61.97.16:3000",
      "https://api.beniexbio.com",
    ],
  })
);

// Connexion à MongoDB
let server;

mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    
    // Démarrer le serveur seulement après la connexion à MongoDB
    server = app.listen(PORT, () => {
      console.log(`Listening on http://72.61.97.16:${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    console.log("Server will not start due to database connection error");
    process.exit(1);
  });

// Route de bienvenue
app.get("/", (req, res) => {
  res.status(200).json({ message: "Bienvenue sur Beniexbio" });
});

// Routes API
app.use("/api/users", authRouter);
app.use("/api/users", userRouter);
app.use("/api/profile", userRouter);
app.use("/api/orders", protect, orderRouter);
app.use("/api/products", productRouter);
app.use("/api/featuredproducts", featuredProductsRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/blogs", blogRouter);
app.use("/api/settings", settingRouter);
app.use("/api/supports", supportRouter);

// 404 handler for unknown routes — doit être après toutes les routes
app.use((req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // En développement, envoyer les détails de l'erreur
  if (NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } 
  // En production, envoyer un message générique
  else {
    // Erreurs opérationnelles, connues - envoyer le message
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } 
    // Erreurs de programmation ou inconnues - ne pas divulguer les détails
    else {
      console.error("ERROR 💥", err);
      res.status(500).json({
        status: "error",
        message: "Something went wrong!",
      });
    }
  }
});

// Gestion des promesses non gérées - sans crash
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  
  // En développement, logger plus de détails
  if (NODE_ENV === "development") {
    console.error("Stack trace:", reason instanceof Error ? reason.stack : reason);
  }
  
  // NE PAS fermer le serveur - juste logger l'erreur
  // Le serveur continue de fonctionner
});

// Gestion des exceptions non capturées - sans crash
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  
  if (NODE_ENV === "development") {
    console.error("Stack trace:", err.stack);
  }
  
  // NE PAS fermer le serveur immédiatement
  // En production, logger l'erreur et continuer
  if (NODE_ENV === "production") {
    console.error("Uncaught exception in production - logging error but continuing");
    // Vous pouvez ajouter ici une logique pour envoyer l'erreur à un service de monitoring
  }
});

// Gestion de la fermeture gracieuse du serveur
const gracefulShutdown = () => {
  console.log("Received shutdown signal, closing server gracefully...");
  
  if (server) {
    server.close(() => {
      console.log("Server closed");
      mongoose.connection.close(false, () => {
        console.log("MongoDB connection closed");
        process.exit(0);
      });
    });
    
    // Forcer la fermeture après 10 secondes
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Signaux pour la fermeture gracieuse
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);