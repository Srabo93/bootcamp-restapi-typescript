import { Hono } from "hono";
import BootcampModel from "../models/Bootcamp";
import ReviewModel from "../models/Review";
// import {
//   bootcampPhotoUpload,
//   createBootcamp,
//   deleteBootcamp,
//   getBootcamp,
//   getBootcamps,
//   getBootcampsInRadius,
//   updateBootcamp,
// } from "../controllers/bootcamps";
// import advancedResults from "../middlewares/advancedResults";

const app = new Hono();

app.get("/", async (c) => {
  const allBootcamps = await BootcampModel.find({}).populate("courses");

  return c.json(allBootcamps);
});

app.get("/:bootcampId", async (c) => {
  const param = c.req.param("bootcampId");
  const bootcamp = await BootcampModel.findById(param).populate("courses");

  return c.json(bootcamp);
});

app.get("/:bootcampId/courses", async (c) => {
  const bootCampId = c.req.param("bootcampId");
  const bootCampRelatedCourses = await BootcampModel.findById(
    bootCampId,
    "name description website"
  )
    .populate("courses")
    .exec();

  return c.json(bootCampRelatedCourses);
});

app.get("/:bootcampId/reviews", async (c) => {
  const bootCampId = c.req.param("bootcampId");
  const bootCampRelatedReviews = await ReviewModel.findById(bootCampId).exec();

  return c.json(bootCampRelatedReviews);
});

export default app;

// router
//   .route("/")
//   .post(
//     protect,
//     validate(createBootcampScheme),
//     authorize("publisher", "admin"),
//     createBootcamp
//   );
//
// router
//   .route("/:id")
//   .put(
//     protect,
//     validate(updateBootcampScheme),
//     authorize("publisher", "admin"),
//     updateBootcamp
//   )
//   .delete(
//     protect,
//     validate(deleteBootcampScheme),
//     authorize("publisher", "admin"),
//     deleteBootcamp
//   );
//
// router
//   .route("/:id/photo")
//   .put(protect, authorize("publisher", "admin"), bootcampPhotoUpload),
//   router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);
//
// export default router;
