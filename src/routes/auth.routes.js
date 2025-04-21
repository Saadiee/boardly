import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  refreshAccessToken,
  loginUser,
  logoutUser,
  forgotPasswordRequest,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { validateUserRegistration } from "../middlewares/validator.middleware.js";
import {
  userRegistrationValidator,
  userEmailValidator,
  userPasswordValidator,
  userLoginValidator,
  changeCurrentPasswordValidator,
} from "../validators/index.js";
import { isLoggedIn } from "../middlewares/isLogged.middleware.js";

const router = Router();

router
  .route("/register")
  .post(userRegistrationValidator(), validateUserRegistration, registerUser);
router.route("/verify/:token").get(verifyEmail);
router
  .route("/resendemail")
  .post(
    userEmailValidator(),
    validateUserRegistration,
    resendEmailVerification,
  );
router
  .route("/forgot-password")
  .post(userEmailValidator(), validateUserRegistration, forgotPasswordRequest);
router
  .route("/reset-password/:resetToken")
  .post(
    userPasswordValidator(),
    validateUserRegistration,
    resetForgottenPassword,
  );
router
  .route("/login")
  .post(userLoginValidator(), validateUserRegistration, loginUser);
router.route("/logout").get(isLoggedIn, logoutUser);
router.route("/profile").get(isLoggedIn, getCurrentUser);
router
  .route("/change-password")
  .post(isLoggedIn, changeCurrentPasswordValidator(), changeCurrentPassword);
router.route("/refresh-accesstoken").get(refreshAccessToken);

export default router;
