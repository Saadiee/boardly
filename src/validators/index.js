import { body } from "express-validator";

const userRegistrationValidator = () => {
  return [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email")
      .notEmpty()
      .withMessage("Email is required")
      .isLength({ max: 50 }),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long")
      .isLength({ max: 20 })
      .withMessage("Username must be at most 20 characters long")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores",
      ),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email")
      .notEmpty()
      .withMessage("Email is required"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ];
};

const userEmailValidator = () => {
  return [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email")
      .notEmpty()
      .withMessage("Email is required"),
  ];
};

const userPasswordValidator = () => {
  return [
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ];
};

const changeCurrentPasswordValidator = () => {
  return [
    body("currentPassword")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("newPassword")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ];
};

export {
  userRegistrationValidator,
  userLoginValidator,
  userEmailValidator,
  userPasswordValidator,
  changeCurrentPasswordValidator,
};
// now we make middleware for the validators in ./middleware/validator.middleware.js
