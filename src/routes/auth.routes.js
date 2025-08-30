import { Router } from "express";
import { registerUser, verifyEmail } from "../controllers/auth.controller.js";
import { registrationValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";

const router = Router();

router.post("/register", registrationValidator(), validate, registerUser);
router.get("/verify/:token", verifyEmail);

export default router;
