import { Router } from "express";
import {
  registerUser,
  verifyEmail,
  resendEmailVerification,
  forgotPasswordRequest,
  resetForgottenPassword,
} from "../controllers/auth.controller.js";
import { validateUserRegistration } from "../middlewares/validator.middleware.js";
import {
  userRegistrationValidator,
  userEmailValidator,
  userPasswordValidator,
} from "../validators/index.js";

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

export default router;
