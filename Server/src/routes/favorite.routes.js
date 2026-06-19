import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorites,
} from "../controllers/favorite.controller.js";

const router = express.Router();

// All favorites routes require authentication
router.use(protect);

router.get("/", getFavorites);
router.get("/check", checkFavorites);
router.post("/check", checkFavorites);
router.post("/", addFavorite);
router.delete("/:itemType/:itemId", removeFavorite);

export default router;
