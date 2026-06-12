import express, { NextFunction, Request, Response } from "express";
import Bottleneck from "bottleneck";
import CourseModel from "../models/Course";
import { authorize, protect } from "../middlewares/auth";
import advancedResults from "../middlewares/advancedResults";
import {
  addCourse,
  deleteCourse,
  getCourse,
  getCourses,
  updateCourse,
} from "../controllers/courses";
import validate from "../middlewares/validate";
import {
  addCourseScheme,
  byIdCourseScheme,
  deleteCourseScheme,
  updateCourseScheme,
} from "../utils/zod/coursesSchemas";

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

router.route("/").get(
  advancedResults(CourseModel, {
    path: "bootcamp",
    select: "name description",
  }),
  getCourses,
).post(
  protect,
  validate(addCourseScheme),
  authorize("publisher", "admin"),
  addCourse,
);

router.route("/:id").get(validate(byIdCourseScheme), getCourse).put(
  protect,
  validate(updateCourseScheme),
  authorize("publisher", "admin"),
  updateCourse,
).delete(
  protect,
  validate(deleteCourseScheme),
  authorize("publisher", "admin"),
  deleteCourse,
);

export default router;
