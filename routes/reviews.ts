import express, { NextFunction, Request, Response } from "express";
import Bottleneck from "bottleneck";
import ReviewModel from "../models/Review";
import { authorize, authenticate } from "../middlewares/auth";
import advancedResults from "../middlewares/advancedResults";
import {
  addReview,
  deleteReview,
  getReview,
  getReviews,
  updateReview,
} from "../controllers/reviews";
import validate from "../middlewares/validate";
import {
  byIdReviewScheme,
  deleteReviewScheme,
  updateReviewScheme,
} from "../utils/zod/reviewSchemas";

const router = express.Router({ mergeParams: true });

const limiter = new Bottleneck({
  maxConcurrent: 10, // Max number of requests to process at once
  minTime: 1000, // Minimum time (in milliseconds) between requests
});

router.use(async (req: Request, res: Response, next: NextFunction) => {
  await limiter.schedule(async () => {
    next();
  });
});

router
  .route("/")
  .get(
    advancedResults(ReviewModel, {
      path: "bootcamp",
      select: "name description",
    }),
    getReviews
  )
  .post(authenticate, authorize("user", "admin"), addReview);

router
  .route("/:id")
  .get(validate(byIdReviewScheme), getReview)
  .put(
    authenticate,
    validate(updateReviewScheme),
    authorize("user", "admin"),
    updateReview
  )
  .delete(
    authenticate,
    validate(deleteReviewScheme),
    authorize("user", "admin"),
    deleteReview
  );

export default router;
