import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import BootcampModel from "../models/Bootcamp";
import ReviewModel from "../models/Review";
import { authenticate, authorize } from "../middlewares/auth";
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

app.post("/", authenticate, authorize("publisher", "admin"), async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  const bootcampExists = await BootcampModel.findOne({ user: user._id });

  if (bootcampExists) {
    throw new HTTPException(409, { message: "Already exists" });
  }

  body.user = user._id;
  const newBootcamp = await BootcampModel.create(body);
  return c.json(newBootcamp, 201);
});

export default app;

// router
//   .route("/")
//   .post(
//     authenticate,
//     validate(createBootcampScheme),
//     authorize("publisher", "admin"),
//     createBootcamp
//   );
//
// router
//   .route("/:id")
//   .put(
//     authenticate,
//     validate(updateBootcampScheme),
//     authorize("publisher", "admin"),
//     updateBootcamp
//   )
//   .delete(
//     authenticate,
//     validate(deleteBootcampScheme),
//     authorize("publisher", "admin"),
//     deleteBootcamp
//   );
//
// router
//   .route("/:id/photo")
//   .put(authenticate, authorize("publisher", "admin"), bootcampPhotoUpload),
//   router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);
//
// export default router;
