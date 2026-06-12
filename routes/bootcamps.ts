import express, { NextFunction, Request, Response } from "express";
import Bottleneck from "bottleneck";
import BootcampModel from "../models/Bootcamp";
import {
  bootcampPhotoUpload,
  createBootcamp,
  deleteBootcamp,
  getBootcamp,
  getBootcamps,
  getBootcampsInRadius,
  updateBootcamp,
} from "../controllers/bootcamps";
import { authorize, protect } from "../middlewares/auth";
import advancedResults from "../middlewares/advancedResults";
/*Include other resources for re-routing*/
import coursesRouter from "./courses";
import reviewsRouter from "./reviews";
import validate from "../middlewares/validate";
import {
  byIdBootcampScheme,
  createBootcampScheme,
  deleteBootcampScheme,
  updateBootcampScheme,
} from "../utils/zod/bootcampSchemas";

const router = express.Router();

const limiter = new Bottleneck({
  maxConcurrent: 10, // Max number of requests to process at once
  minTime: 1000, // Minimum time (in milliseconds) between requests
});

/* Re-route into other resource */
router.use("/:bootcampId/courses", coursesRouter);
router.use("/:bootcampId/reviews", reviewsRouter);

router.use(async (req: Request, res: Response, next: NextFunction) => {
  await limiter.schedule(async () => {
    next();
  });
});


router
  .route("/")
  .get(advancedResults(BootcampModel, "courses"), getBootcamps)
  .post(
    protect,
    validate(createBootcampScheme),
    authorize("publisher", "admin"),
    createBootcamp,
  );

router
  .route("/:id")
  .get(validate(byIdBootcampScheme), getBootcamp)
  .put(
    protect,
    validate(updateBootcampScheme),
    authorize("publisher", "admin"),
    updateBootcamp,
  )
  .delete(
    protect,
    validate(deleteBootcampScheme),
    authorize("publisher", "admin"),
    deleteBootcamp,
  );

router
  .route("/:id/photo")
  .put(
    protect,
    authorize("publisher", "admin"),
    bootcampPhotoUpload,
  ), router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

export default router;
