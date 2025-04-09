import { body } from "express-validator";

const registrationValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalide email"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3 })
      .withMessage("Must be 3 or more characters long")
      .isLength({ max: 10 })
      .withMessage("Must be 10 or fewer characters long"),
    body("fullname")
      .trim()
      .notEmpty()
      .withMessage("Fullname is required")
      .isLength({ min: 3 })
      .withMessage("Must be 3 or more characters long")
      .isLength({ max: 10 })
      .withMessage("Must be 10 or fewer characters long"),
  ];
};

const loginValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalide email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Must be 6 or more characters long")
      .isLength({ max: 10 })
      .withMessage("Must be 10 characters long"),
  ];
};

export { registrationValidator, loginValidator };
