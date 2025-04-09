import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];

  errors.array().map((err) => {
    extractedErrors.push({
      [err.path]: err.msg,
    });
  });

  throw new ApiError(422, "Recived datais not valid", extractedErrors);
};
