import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validateUserRegistration = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => {
    extractedErrors.push({
      [err.path]: err.msg,
    });
    console.log(err); // !Console Log
  });
  throw new ApiError(
    401,
    "Recieved Registration Data is invalid",
    extractedErrors,
  );

  console.log(errors); // !Console Log
  console.log(typeof errors); // !Console Log
};
