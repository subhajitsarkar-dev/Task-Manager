import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";

dotenv.config();

export const isLoggedIn = asyncHandler(async (req, res, next) => {
  try {
    let token =
      req.cookies.accessToken ||
      req.header("Authorization ")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "UnAuthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(500, "Invalid access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, error?.message || "Internal server erroe"));
  }
});
