import express from "express";
const router = express.Router();
import { findUser } from "../controllers/search-controller.js";
import authMiddleware from "../middleware/auth.js";

router.post("/", authMiddleware.verify, findUser);

export default router;