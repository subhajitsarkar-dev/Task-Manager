import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { registrationValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";

const router = Router();

router.post("/register", registrationValidator(), validate, registerUser);

export default router;
