import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { validateUserRegistration } from "../middlewares/validator.middleware.js";
import { userRegistrationValidator } from "../validators/index.js";

const router = Router();

router
  .route("/register")
  .post(userRegistrationValidator(), validateUserRegistration, registerUser);

export default router;
