import { Request, Response } from "express";
import UserModel from "../models/User";
import asyncHandler from "express-async-handler";
import serverResponse from "../utils/helpers/responses";
import messages from "../config/messages";

/**
 * Get All Users
 * @route GET /api/v1/auth/users
 * @access Private/Admin
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  serverResponse.sendSuccess(res, messages.SUCCESSFUL, res.advancedResults);
});

/**
 * Get Single User
 * @route GET /api/v1/auth/users/:id
 * @access Private/Admin
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) {
    serverResponse.sendError(res, messages.NOT_FOUND);
  }
  serverResponse.sendSuccess(res, messages.SUCCESSFUL, user);
});

/**
 * Create User
 * @route POST /api/v1/auth/users
 * @access Private/Admin
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.find({ email: req.body.email });

  if (user) {
    serverResponse.sendError(res, messages.ALREADY_EXIST);
  }

  const newUser = await UserModel.create(req.body);

  serverResponse.sendSuccess(res, messages.SUCCESSFUL, newUser);
});

/**
 * Update User
 * @route PUT /api/v1/auth/users/:id
 * @access Private/Admin
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  serverResponse.sendSuccess(res, messages.SUCCESSFUL, user);
});

/**
 * Delete User
 * @route DELETE /api/v1/auth/users/:id
 * @access Private/Admin
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await UserModel.findByIdAndDelete(req.params.id);
  serverResponse.sendSuccess(res, messages.SUCCESSFUL, {});
});
