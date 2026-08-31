import express from "express";
const router = express.Router();
import { fetchData } from "../controllers/index-controller.js";
import authMiddleware from "../middleware/auth.js";

router.get("/", authMiddleware.verify, fetchData);

export default router;