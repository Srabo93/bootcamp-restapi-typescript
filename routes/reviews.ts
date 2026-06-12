import express, { NextFunction, Request, Response } from "express";
import Bottleneck from "bottleneck";
import ReviewModel from "../models/Review";
import { authorize, protect } from "../middlewares/auth";
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
  .post(protect, authorize("user", "admin"), addReview);

router
  .route("/:id")
  .get(validate(byIdReviewScheme), getReview)
  .put(
    protect,
    validate(updateReviewScheme),
    authorize("user", "admin"),
    updateReview
  )
  .delete(
    protect,
    validate(deleteReviewScheme),
    authorize("user", "admin"),
    deleteReview
  );

export default router;
