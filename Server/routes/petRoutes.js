import express from "express";
import {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  getMyPets,
} from "../controllers/petController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my/listings", protect, getMyPets);

router.get("/", getPets);
router.post("/", protect, createPet);
router.get("/:id", getPet);
router.put("/:id", protect, authorize("user", "admin"), updatePet);
router.delete("/:id", protect, authorize("user", "admin"), deletePet);

export default router;
