import { Router } from "express";
import {
  changeCurrentPassword,
  curentUser,
  forgotPasswordRequest,
  getAllUser,
  loginUser,
  logoutUser,
  registerUser,
  resendVerifyEmail,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { loginValidator, registrationValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registrationValidator(), validate, registerUser);
router.get("/verify/:token", verifyEmail);
router.post("/resendverifyemail", resendVerifyEmail);
router.post("/login", loginValidator(), validate, loginUser);
router.post("/forgotpassword", isLoggedIn, forgotPasswordRequest);
router.patch("/verify/:token", isLoggedIn, changeCurrentPassword);
router.get("/me", isLoggedIn, curentUser);
router.get("/users", isLoggedIn, getAllUser);

export default router;
