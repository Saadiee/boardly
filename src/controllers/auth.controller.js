import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.model.js";
import {
  sendMail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
} from "../utils/mail.js";

const base_url = "http://localhost:8000/api/v1";
dotenv.config();

// * DONE
const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullName } = req.body;
  // check if user already exists then resend verification token
  const existingUser = await User.findOne({ email });
  if (existingUser && !existingUser.isEmailVerified) {
    existingUser.emailVerificationToken = "";
    await existingUser.save();
    const { unhashedToken } = existingUser.generateTemporaryToken();
    existingUser.emailVerificationToken = unhashedToken;
    await existingUser.save();
    await sendMail({
      email: existingUser.email,
      subject: "Email verification",
      mailGenContent: emailVerificationMailgenContent(
        username,
        `${base_url}/verify/${unhashedToken}`,
      ),
    });
    return res.status(409).json({
      statusCode: 409,
      success: false,
      message:
        "User already exists. Please check your inbox to verify your email address",
    });
  }
  // create use in database
  const user = await User.create({ email, username, password, fullName });
  if (!user) {
    return res.status(401).json(new ApiError(401, "User not registered"));
  }
  // create a verification token
  const { unhashedToken, tokenExpiry } = user.generateTemporaryToken();
  // save token in databse
  user.emailVerificationToken = unhashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  // save user in DB
  await user.save();
  // send token in email to use
  await sendMail({
    email: user.email,
    subject: "Email verification",
    mailGenContent: emailVerificationMailgenContent(
      username,
      `${base_url}/verify/${unhashedToken}`,
    ),
  });
  // send success status to user
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "",
        "Registration successfull, Please verify your email now",
      ),
    );
});

// * DONE
const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.params.token;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });
  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "User not exists | User already verified"));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = "";
  user.emailVerificationTokenExpiry = "";
  await user.save();
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
      },
      "User successfully verified",
    ),
  );
});

// * DONE
const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isEmailVerified: false });
  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "Bad Request, User doesnot exits"));
  }
  const { unhashedToken, tokenExpiry } = user.generateTemporaryToken();
  user.emailVerificationToken = unhashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  await user.save();

  await sendMail({
    email: user.email,
    subject: "Email verification",
    mailGenContent: emailVerificationMailgenContent(
      username,
      `${base_url}/verify/${unhashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "",
        "Registeration email resend successfully, Please verify your email now",
      ),
    );

  //validation
});

// * DONE
const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const passwordResetToken = req.params.resetToken;
  //validation
  const user = await User.findOne({
    forgotPasswordToken: passwordResetToken,
    forgotPasswordTokenExpiry: { $gt: Date.now() },
  });
  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "Bad Request, User doesnot exits"));
  }
  if (password !== confirmPassword) {
    return res.status(401).json(new ApiError(401, "Password doesn't match"));
  }
  user.password = password;
  user.forgotPasswordToken = "";
  user.forgotPasswordTokenExpiry = "";
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

// * DONE
const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isEmailVerified: true });
  if (!user) {
    return res
      .status(404)
      .json(new ApiError(404, "User not found or email not verified"));
  }
  if (user.forgotPasswordTokenExpiry > Date.now()) {
    return res
      .status(429)
      .json(
        new ApiError(
          429,
          "Reset link already sent. Please wait before requesting again.",
        ),
      );
  }

  const { unhashedToken, tokenExpiry } = user.generateTemporaryToken();
  user.forgotPasswordToken = unhashedToken;
  user.forgotPasswordTokenExpiry = tokenExpiry;
  await user.save();
  await sendMail({
    email: user.email,
    subject: "Reset Password",
    mailGenContent: forgotPasswordMailgenContent(
      user.username,
      `${base_url}/reset-password/${unhashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Reset password email sent"));
});

// * DONE
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "User not found to be logged in"));
  }
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const isPassMatch = await user.isPasswordCorrect(currentPassword);

  if (!isPassMatch) {
    return res
      .status(401)
      .json(new ApiError(401, "Current password is incorrect"));
  }
  if (newPassword !== confirmNewPassword) {
    return res.status(401).json(new ApiError(401, "Password doesn't match"));
  }
  user.password = newPassword;
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));

  //validation
});

// * DONE
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "-password -emailVerificationToken -forgotPasswordToken -refreshToken",
  );
  if (!user) {
    return res
      .json(400)
      .json(new ApiError(400, "User not found to be logged in"));
  }
  res.status(200).json(new ApiResponse(200, user, "User found"));
});

// ? Working
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json(new ApiError(401, "Unauthorized error"));
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json(new ApiError(401, "User not found"));
    }
    const accessToken = user.generateAccessToken();
    return res.status(200).json({
      accessToken,
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    return res
      .status(401)
      .json(new ApiError(401, "Invalid or expired refresh token"));
  }
});

// * DONE
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(401)
      .json(new ApiError(401, "Email or password is incorrect"));
  }
  const isPassMatch = await user.isPasswordCorrect(password);
  if (!isPassMatch) {
    return res
      .status(401)
      .json(new ApiError(401, "Email or password is incorrect"));
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const cookieOpt = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    sameSite: "strict",
  };
  res.cookie("refreshToken", refreshToken, cookieOpt);
  user.refreshToken = refreshToken;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id: user._id, email: user.email, role: user.role, accessToken },
        "User login sucessfull",
      ),
    );
});

// * DONE
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "-password -emailVerificationToken -forgotPasswordToken -refreshToken",
  );
  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "User not found to be logged in"));
  }
  user.refreshToken = "";
  await user.save();
  // clear cookie
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: new Date(0),
  });

  res.status(200).json(new ApiResponse(200, {}, "User logout successfully"));
});

export {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  verifyEmail,
};
