import express from "express";
const router = express.Router();
import authMiddleware from "../middleware/auth.js";
import { upload } from "../config/cloud-config.js";
import { getImageUploaded } from "../controllers/pic-upload-controller.js";

router.post("/", authMiddleware.verify, upload.single("image"), getImageUploaded);

export default router;