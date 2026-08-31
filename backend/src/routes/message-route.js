import express from "express";
const router  = express.Router();
import { getMessage } from "../controllers/message-controller.js";
import authMiddleware from "../middleware/auth.js";

router.post("/", authMiddleware.verify, getMessage);

export default router;