import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/config";
import User from "../models/User";
import asyncHandler from "express-async-handler";
import serverResponse from "../utils/helpers/responses";
import messages from "../config/messages";

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new Error("Not authorized to access this route"));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      req.user = await User.findById(decoded.id);
      next();
    } catch (error) {
      return next(new Error("Not authorized to access this route"));
    }
  },
);

type roles = [string?, string?];

export const authorize = (...roles: roles) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        serverResponse.sendError(res, messages.AUTHENTICATION_FAILED),
      );
    }
    next();
  };
};
