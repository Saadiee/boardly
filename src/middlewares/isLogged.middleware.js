import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

dotenv.config();

export const isLoggedIn = asyncHandler(async (req, res, next) => {
  const getRefreshToken = req.cookies?.refreshToken;
  if (!getRefreshToken) {
    return res
      .status(401)
      .json(
        new ApiError(
          401,
          "Authentication failed. RefreshToken not found in cookie",
        ),
      );
  }
  try {
    const decodedToken = jwt.verify(
      getRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    console.log("Decoded Token(isLogged.middleware):", decodedToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res
      .status(401)
      .json(new ApiError(401, "Invalid or expired refresh token"));
  }
});
