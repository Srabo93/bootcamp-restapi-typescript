import { Request, Response, NextFunction } from "express";
import logger from "../utils/helpers/logger";

function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.fatal(JSON.stringify(err.message)); // Set default status code and error message
  let statusCode = 500;
  let errorMessage = "Server Error";

  // Check if the error has a status code and message
  if (err.statusCode && err.message) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  }

  // Log the error
  console.error(err);

  // Return the error response
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
  });
}

export default errorHandler;
