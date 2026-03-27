import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Mount routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/pets", petRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(errorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});