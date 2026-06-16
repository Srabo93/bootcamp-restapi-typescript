import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { authenticate } from "../middlewares/auth";
import { signToken, matchPassword, generateResetToken } from "../utils/auth";
import UserModel from "../models/User";
import sendEmail from "../utils/sendEmail";

const app = new Hono();

app.post(
  "/register",
  zValidator(
    "json",
    z.object({
      name: z.string().trim().max(256),
      email: z.string().trim().max(256).email(),
      password: z.string().trim().max(256).min(6),
      role: z.enum(["user", "publisher"]),
    })
  ),
  async (c) => {
    const { name, email, password, role } = c.req.valid("json");
    const exists = await UserModel.findOne({ email });
    if (exists) throw new HTTPException(409, { message: "Already exists" });
    const user = await UserModel.create({ name, email, password, role });
    const token = signToken(user._id.toString(), user.role);
    return c.json({ success: true, token }, 201);
  }
);

app.post(
  "/login",
  zValidator(
    "json",
    z.object({
      email: z.string().trim().max(256).email(),
      password: z.string().trim().max(256).min(6),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) throw new HTTPException(401, { message: "Invalid credentials" });
    const isMatch = await matchPassword(password, user.password);
    if (!isMatch)
      throw new HTTPException(401, { message: "Invalid credentials" });
    const token = signToken(user._id.toString(), user.role);
    return c.json({ success: true, token }, 200);
  }
);

app.get("/logout", authenticate, async (c) => {
  return c.json({ success: true, data: {} }, 200);
});

app.get("/me", authenticate, async (c) => {
  const { _id } = c.get("user");
  const user = await UserModel.findById(_id);
  if (!user) throw new HTTPException(404, { message: "User not found" });
  return c.json({ success: true, data: user }, 200);
});

app.put(
  "/updatedetails",
  authenticate,
  zValidator(
    "json",
    z.object({
      name: z.string().trim().max(256).optional(),
      email: z.string().trim().max(256).email().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const updated = await UserModel.findByIdAndUpdate(user._id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) throw new HTTPException(404, { message: "User not found" });
    return c.json({ success: true, data: updated }, 200);
  }
);

app.put(
  "/updatepassword",
  authenticate,
  zValidator(
    "json",
    z.object({
      currentPassword: z.string().trim().max(256).min(6),
      newPassword: z.string().trim().max(256).min(6),
    })
  ),
  async (c) => {
    const authUser = c.get("user");
    const { currentPassword, newPassword } = c.req.valid("json");
    const user = await UserModel.findById(authUser._id).select("+password");
    if (!user) throw new HTTPException(404, { message: "User not found" });
    const isMatch = await matchPassword(currentPassword, user.password);
    if (!isMatch) throw new HTTPException(401, { message: "Invalid password" });
    user.password = newPassword;
    await user.save();
    const token = signToken(user._id.toString(), user.role);
    return c.json({ success: true, token }, 200);
  }
);

app.post(
  "/forgotpassword",
  zValidator(
    "json",
    z.object({
      email: z.string().trim().max(256).email(),
    })
  ),
  async (c) => {
    const { email } = c.req.valid("json");
    const user = await UserModel.findOne({ email });
    if (!user) throw new HTTPException(404, { message: "User not found" });
    const { token, hash, expire } = generateResetToken();
    user.resetPasswordToken = hash;
    user.resetPasswordExpire = expire;
    await user.save({ validateBeforeSave: false });
    const protocol = c.req.url.startsWith("https") ? "https" : "http";
    const host = c.req.header("host") || "localhost:8080";
    const resetUrl = `${protocol}://${host}/api/v1/auth/resetpassword/${token}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to:\n\n${resetUrl}`;
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
      });
      return c.json({ success: true, data: {} }, 200);
    } catch {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save({ validateBeforeSave: false });
      throw new HTTPException(500, { message: "Email could not be sent" });
    }
  }
);

app.put(
  "/resetpassword/:resettoken",
  zValidator(
    "json",
    z.object({
      password: z.string().trim().max(256).min(6),
    })
  ),
  async (c) => {
    const { password } = c.req.valid("json");
    const resetToken = c.req.param("resettoken");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user)
      throw new HTTPException(400, { message: "Invalid or expired token" });
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();
    const token = signToken(user._id.toString(), user.role);
    return c.json({ success: true, token }, 200);
  }
);

export default app;
