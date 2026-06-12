import express, { NextFunction, Request, Response } from "express";
import Bottleneck from "bottleneck";
import UserModel from "../models/User";
import { authorize, protect } from "../middlewares/auth";
import advancedResults from "../middlewares/advancedResults";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/users";
import validate from "../middlewares/validate";
import {
  byIdUserScheme,
  createUserScheme,
  deleteUserScheme,
  updateUserScheme,
} from "../utils/zod/userSchemas";

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

router.use(protect);
router.use(authorize("admin"));
router
  .route("/")
  .get(advancedResults(UserModel), getUsers)
  .post(validate(createUserScheme), createUser);
router
  .route("/:id")
  .get(validate(byIdUserScheme), getUser)
  .put(validate(updateUserScheme), updateUser)
  .delete(validate(deleteUserScheme), deleteUser);
export default router;
