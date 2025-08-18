import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorMessages = errors.array().map(err => ({
    field: err.param,
    message: err.msg
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errorMessages
  });
};

export default validate;
