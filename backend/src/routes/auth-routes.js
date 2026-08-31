import express from "express";
const router = express.Router();
import authControllers from "../controllers/auth-controllers.js";

router.post("/signup", authControllers.signup);
router.post("/login", authControllers.login);
router.get("/logout", authControllers.logout);

export default router;