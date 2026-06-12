import express, { NextFunction, Request, Response } from "express";
import Bottleneck from "bottleneck";
import { protect } from "../middlewares/auth";
import validate from "../middlewares/validate";
import {
  currentUser,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  updateDetails,
  updatePassword,
} from "../controllers/auth";
import {
  currentUserScheme,
  forgotPasswordScheme,
  loginScheme,
  registerSchema,
  updatePasswordScheme,
  updateUserDetailsScheme,
} from "../utils/zod/authSchemas";

const router = express.Router();

const limiter = new Bottleneck({
  maxConcurrent: 10, // Max number of requests to process at once
  minTime: 1000, // Minimum time (in milliseconds) between requests
});

router.use(async (req: Request, res: Response, next: NextFunction) => {
  await limiter.schedule(async () => {
    next();
  });
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginScheme), login);
router.get("/logout", logout);
router.get("/me", protect, validate(currentUserScheme), currentUser);
router.put(
  "/updatedetails",
  protect,
  validate(updateUserDetailsScheme),
  updateDetails,
);
router.post("/forgotpassword", validate(forgotPasswordScheme), forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);
router.put(
  "/updatepassword",
  protect,
  validate(updatePasswordScheme),
  updatePassword,
);

export default router;
