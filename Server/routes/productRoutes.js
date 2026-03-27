import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getProducts).post(protect, authorize("admin"), createProduct);

router.route("/:id").get(getProduct);

export default router;
