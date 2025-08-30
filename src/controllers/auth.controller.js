import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailGenContent, sendMail } from "../utils/mail.js";
import crypto from "crypto";

export const registerUser = asyncHandler(async (req, res) => {
  const { email, username, fullname, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json(new ApiResponse(400, "User already exist"));
    }

    const user = await User.create({
      email,
      username,
      fullname,
      password,
    });

    if (!user) {
      return res.status(500).json({
        success: false,
        message: "User could not be registered",
      });
    }

    const { hashedToken, unHashedToken, tokenExpiry } =
      await user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save();

    await sendMail({
      email: user.email,
      subject: "Verify Your Email - Task Manager",
      mailGenContent: emailVerificationMailGenContent(
        username,
        `http://localhost:4000/api/v1/auth/verify/${unHashedToken}`,
      ),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, user, "User registered successfully"));
  } catch (error) {
    return new ApiError(401, "User not registred");
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const logoutUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Verification token is required"));
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "Invalid or expired verification token"),
        );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Email verified successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Email verification failed",
        ),
      );
  }
});

export const resendVerifyEmail = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const refressAccessToken = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const curentUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});
