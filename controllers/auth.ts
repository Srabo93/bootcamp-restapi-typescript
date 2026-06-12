import { Request, Response } from "express";
import UserModel from "../models/User";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import sendEmail from "../utils/sendEmail";
import sendTokenResponse from "../utils/helpers/sendTokenResponse";
import serverResponse from "../utils/helpers/responses";
import messages from "../config/messages";

/**
 * Register user
 * @route POST /api/v1/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  const user = await UserModel.findOne({ email });

  if (user) {
    serverResponse.sendError(res, messages.ALREADY_EXIST);
    return;
  }

  const newUser = await UserModel.create({
    name,
    email,
    password,
    role,
  });

  const token = newUser.getSignedJwtToken();

  sendTokenResponse(token, 200, res);
});

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    serverResponse.sendError(res, messages.AUTHENTICATION_FAILED);
  }

  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    serverResponse.sendError(res, messages.NOT_FOUND);
  }

  if (user) {
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      serverResponse.sendError(res, messages.AUTHENTICATION_FAILED);
    }

    const token = user.getSignedJwtToken();

    sendTokenResponse(token, 200, res);
  }
});

/**
 * Logout user
 * @route GET /api/v1/auth/logout
 * @access Private
 */

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 100),
    httpOnly: true,
  });

  serverResponse.sendSuccess(res, messages.SUCCESSFUL, { data: {} });
});

/**
 * Get current logged in user
 * @route POST /api/v1/auth/me
 * @access Private
 */

export const currentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.user.id);

  if (!user) {
    serverResponse.sendError(res, messages.INTERNAL_SERVER_ERROR);
  }
  serverResponse.sendSuccess(res, messages.SUCCESSFUL, user);
});

/**
 * Update user details
 * @route PUT /api/v1/auth/updatedetails
 * @access Private
 */
export const updateDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    const user = await UserModel.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    serverResponse.sendSuccess(res, messages.SUCCESSFUL_UPDATE, user);
  }
);

/**
 * Update Password
 * @route PUT /api/v1/auth/updatepassword
 * @access Private
 */
export const updatePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.user.id).select("+password");

    if (!(await user?.matchPassword(req.body.currentPassword))) {
      serverResponse.sendError(res, messages.AUTHENTICATION_FAILED);
    }

    if (user) {
      user.password = req.body.newPassword;
      await user?.save();
      const token = user?.getSignedJwtToken();

      sendTokenResponse(token, 200, res);
    }
  }
);

/**
 * Forgot Password
 * @route POST /api/v1/auth/forgotpassword
 * @access Public
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      serverResponse.sendError(res, messages.NOT_FOUND);
    }

    if (user) {
      const resetToken = user?.getResetPasswordRoken();
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/resetpassword/${resetToken}`;

      const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

      try {
        await sendEmail({
          email: user.email,
          subject: "Password Reset Token",
          message,
        });
        serverResponse.sendSuccess(res, messages.SUCCESSFUL, user);
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });
        serverResponse.sendError(res, messages.INTERNAL_SERVER_ERROR);
      }
    }
  }
);

/**
 * Reset password
 * @route PUT /api/v1/auth/resetpassword/:resettoken
 * @access Public
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      serverResponse.sendError(res, messages.BAD_REQUEST);
    }

    if (user) {
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      const token = user.getSignedJwtToken();
      sendTokenResponse(token, 200, res);
    }
  }
);
