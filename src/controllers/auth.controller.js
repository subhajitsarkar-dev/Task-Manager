import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailGenContent, sendMail } from "../utils/mail.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json(new ApiResponse(400, "User is not exist"));
    }
    console.log(user.password);

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json(new ApiResponse(400, "Enter valid password"));
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken -forgotPasswordToken -emailVerificationToken",
    );

    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...options,
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, refreshToken },
          "User login successfully",
        ),
      );
  } catch (error) {
    return res
      .status(401)
      .json(new ApiResponse(401, error.message || "User login failed"));
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      },
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, "User logout successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, error?.message || "Logout failed"));
  }
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
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(new ApiError(400, "Email is required!"));
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found!"));
    }

    if (user.isEmailVerified) {
      return res
        .status(400)
        .json(new ApiError(400, "Email is already verified!"));
    }

    const currentTime = Date.now();

    // Check if valid token already exists
    if (
      user.emailVerificationToken &&
      user.emailVerificationExpiry > currentTime
    ) {
      const timeLeft = Math.ceil(
        (user.emailVerificationExpiry - currentTime) / (60 * 1000),
      );

      return res
        .status(429)
        .json(
          new ApiResponse(
            429,
            null,
            `Please wait ${timeLeft} minutes before requesting a new verification email. The previous token is still valid.`,
          ),
        );
    }

    // Generate new token
    const { hashedToken, unHashedToken, tokenExpiry } =
      await user.generateTemporaryToken();

    // Update user with new token
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Send verification email
    await sendMail({
      email: user.email,
      subject: "Verify Your Email - Task Manager",
      mailGenContent: emailVerificationMailGenContent(
        user.username,
        `${process.env.FRONTEND_URL || "http://localhost:4000"}/api/v1/auth/verify/${unHashedToken}`,
      ),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Verification email sent successfully"));
  } catch (error) {
    console.error("Resend verification email error:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Failed to send verification email",
        ),
      );
  }
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
