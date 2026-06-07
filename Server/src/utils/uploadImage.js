import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary storage for pet listing images
const petStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "petcenter/listings",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 900, crop: "limit", quality: "auto" }],
  },
});

// Cloudinary storage for profile photos
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "petcenter/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }],
  },
});

// Cloudinary storage for product images (Phase 2)
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "petcenter/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const uploadPetImages = multer({
  storage: petStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB per file, max 5 files
}).array("images", 5);

export const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("profileImage");

// Product images upload — max 8 images per product
export const uploadProductImages = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5MB per file, max 8 files
}).array("images", 8);
