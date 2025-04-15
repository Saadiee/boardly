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

// TODO
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

// ? Working
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res
      .json(400)
      .json(new ApiError(400, "User not found to be logged in"));
  }
  res.status(200).json(new ApiResponse(200, user, "User found"));
});

// TODO
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  //validation
});

// ? Working
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(401)
      .json(new ApiError(401, "Email or password is incorrect"));
  }
  const isPassMatch = user.isPasswordCorrect(password);
  if (!isPassMatch) {
    return res
      .status(401)
      .json(new ApiError(401, "Email or password is incorrect"));
  }

  const jwtOptions = {
    expiresIn: process.env.JWT_EXPIRY,
  };
  const jwtToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    jwtOptions,
  );

  const cookieOpt = {
    httpOnly: true,
    secure: true,
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
  };
  res.cookie("jwtToken", jwtToken, cookieOpt);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id: user._id, email: user.email, role: user.role },
        "User login sucessfull",
      ),
    );
});

// TODO
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie(jwtToken, "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
  });
  res.send(200).json(new ApiResponse(200, {}, "User logout sucessfully"));
  //validation
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
