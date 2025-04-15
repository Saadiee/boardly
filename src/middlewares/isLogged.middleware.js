import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

dotenv.config();

export const isLoggedIn = asyncHandler(async (req, res, next) => {
  const jwtToken = req.cookies?.jwtToken;
  if (!jwtToken) {
    return res
      .status(401)
      .json(
        new ApiError(
          401,
          "Authentication failed. jwtToken not found in cookie",
        ),
      );
  }
  const decodedJwt = jwt.verify(jwtToken, process.env.JWT_SECRET);
  req.user = decodedJwt;

  next();
});
