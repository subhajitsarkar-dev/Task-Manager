import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  emailVerificationMailGenContent,
  forgotPasswordVerificationEmail,
  sendMail,
} from "../utils/mail.js";

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
  const inComingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!inComingRefreshToken) {
    throw new ApiError(401, "unAuthorized token");
  }

  try {
    const decodedToken = awaitjwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (inComingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "RefreshToken is expired");
    }

    if (!user) {
      throw new ApiError(401, "Invalid refreshToken");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const newRefreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refresh successfully",
        ),
      );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, "Invalide credential"));
  }
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't throw an error if user doesn't exist (security best practice)
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "If the email exists, a reset link has been sent",
          ),
        );
    }

    const { hashedToken, unHashedToken, tokenExpiry } =
      await user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false }); // Skip validation when saving token

    await sendMail({
      email: user.email,
      subject: "Password Reset - Task Manager",
      mailGenContent: forgotPasswordVerificationEmail(
        user.username,
        `http://localhost:4000/api/v1/auth/reset-password/${unHashedToken}`,
      ),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, "If the email exists, a reset link has been sent"),
      );
  } catch (error) {
    // Reset token and expiry if email fails to send
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Forgot password request failed!",
        ),
      );
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Invalid token");
  }
  if (!newPassword) {
    throw new ApiError(400, "Password is required");
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    user.password = newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save(); // Save the user with new password

    return res
      .status(200)
      .json(new ApiResponse(200, "Password reset successfully!"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message || "Password reset failed!",
        ),
      );
  }
});

export const curentUser = asyncHandler(async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("-password");
    if (!currentUser) {
      throw new ApiError(500, "CurrentUser not found!");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, currentUser, "Get current user!"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Current User Getting failed!",
        ),
      );
  }
});

export const getAllUser = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select("password");
    if (!users) {
      throw new ApiError(500, "All user not found!");
    }

    return res.status(201).json(new ApiResponse(201, users, "Get all user!"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Current User Getting failed!",
        ),
      );
  }
});
